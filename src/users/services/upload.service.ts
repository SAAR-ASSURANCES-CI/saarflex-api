import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { User } from '../entities/user.entity';
import { DevisSimule } from '../../produits/entities/devis-simule.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly uploadPath = 'uploads/profiles';

  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(DevisSimule)
    private devisSimuleRepository: Repository<DevisSimule>,
  ) {
    this.ensureUploadDirectoryExists();
  }

  /**
   * Upload des photos de carte d'identité
   */
  async uploadIdentityPhotos(
    userId: string,
    rectoFile: Express.Multer.File,
    versoFile: Express.Multer.File
  ): Promise<{ recto_path: string; verso_path: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    const folderName = this.sanitizeFolderName(user.nom);
    const userFolderPath = path.join(this.uploadPath, folderName);

    this.ensureUserDirectoryExists(userFolderPath);

    let rectoPath: string | null = null;
    let versoPath: string | null = null;

    try {
      rectoPath = await this.saveFile(rectoFile, userFolderPath, 'recto.png');
      
      versoPath = await this.saveFile(versoFile, userFolderPath, 'verso.png');

      await this.updateProfilePaths(userId, rectoPath, versoPath);

      return {
        recto_path: rectoPath,
        verso_path: versoPath
      };

    } catch (error) {
      await this.cleanupUploadedFiles(rectoPath, versoPath);
      throw error;
    }
  }

  /**
   * Sauvegarde un fichier sur le disque
   */
  private async saveFile(
    file: Express.Multer.File,
    destinationFolder: string,
    filename: string
  ): Promise<string> {
    const filePath = path.join(destinationFolder, filename);
    
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, file.buffer, (err) => {
        if (err) {
          reject(new InternalServerErrorException('Erreur lors de la sauvegarde du fichier'));
        } else {
          resolve(filePath);
        }
      });
    });
  }

  /**
   * Met à jour les chemins des fichiers dans le profil
   */
  private async updateProfilePaths(
    userId: string,
    rectoPath: string,
    versoPath: string
  ): Promise<void> {
    await this.profileRepository.update(
      { user_id: userId },
      {
        chemin_recto_piece: rectoPath,
        chemin_verso_piece: versoPath
      }
    );
  }

  /**
   * Nettoie les fichiers uploadés en cas d'erreur
   */
  private async cleanupUploadedFiles(rectoPath: string | null, versoPath: string | null): Promise<void> {
    const filesToDelete = [rectoPath, versoPath].filter((path): path is string => path !== null);
    
    for (const filePath of filesToDelete) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Erreur lors de la suppression du fichier ${filePath}:`, error);
      }
    }
  }

  /**
   * Crée le dossier uploads/profiles s'il n'existe pas
   */
  private ensureUploadDirectoryExists(): void {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  /**
   * Crée le dossier utilisateur s'il n'existe pas
   */
  private ensureUserDirectoryExists(userFolderPath: string): void {
    if (!fs.existsSync(userFolderPath)) {
      fs.mkdirSync(userFolderPath, { recursive: true });
    }
  }

  /**
   * Nettoie le nom de dossier (supprime les caractères spéciaux)
   */
  private sanitizeFolderName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Upload des photos de carte d'identité de l'assuré (quand assuré ≠ souscripteur)
   */
  async uploadAssureIdentityPhotos(
    devisId: string,
    userId: string,
    rectoFile: Express.Multer.File,
    versoFile: Express.Multer.File
  ): Promise<{ recto_path: string; verso_path: string }> {
    // Vérifier que le devis existe et appartient à l'utilisateur
    const devis = await this.devisSimuleRepository.findOne({
      where: { 
        id: devisId, 
        utilisateur_id: userId 
      }
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé ou vous n\'avez pas les droits');
    }

    // Vérifier que l'assuré n'est pas le souscripteur
    if (devis.assure_est_souscripteur) {
      throw new BadRequestException('Cet endpoint est réservé aux cas où l\'assuré est différent du souscripteur');
    }

    // Créer le nom de dossier basé sur l'ID du devis
    const folderName = `devis_${devisId}`;
    const devisFolderPath = path.join(this.uploadPath, 'assures', folderName);

    // Créer le dossier devis s'il n'existe pas
    this.ensureUserDirectoryExists(devisFolderPath);

    let rectoPath: string | null = null;
    let versoPath: string | null = null;

    try {
      // Upload du recto
      rectoPath = await this.saveFile(rectoFile, devisFolderPath, 'recto.png');
      
      // Upload du verso
      versoPath = await this.saveFile(versoFile, devisFolderPath, 'verso.png');

      // Mettre à jour le devis avec les chemins des fichiers
      await this.devisSimuleRepository.update(devisId, {
        chemin_recto_assure: rectoPath,
        chemin_verso_assure: versoPath
      });

      return {
        recto_path: rectoPath,
        verso_path: versoPath
      };

    } catch (error) {
      // En cas d'erreur, nettoyer les fichiers déjà uploadés
      await this.cleanupUploadedFiles(rectoPath, versoPath);
      throw error;
    }
  }

  /**
   * Valide les fichiers uploadés
   */
  validateFiles(rectoFile: Express.Multer.File, versoFile: Express.Multer.File): void {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!rectoFile) {
      throw new BadRequestException('Photo recto de la carte d\'identité requise');
    }
    if (!allowedMimeTypes.includes(rectoFile.mimetype)) {
      throw new BadRequestException('Format de fichier non supporté pour le recto. Formats acceptés: JPEG, PNG, WebP');
    }
    if (rectoFile.size > maxSize) {
      throw new BadRequestException('Fichier recto trop volumineux. Taille maximum: 5MB');
    }

    if (!versoFile) {
      throw new BadRequestException('Photo verso de la carte d\'identité requise');
    }
    if (!allowedMimeTypes.includes(versoFile.mimetype)) {
      throw new BadRequestException('Format de fichier non supporté pour le verso. Formats acceptés: JPEG, PNG, WebP');
    }
    if (versoFile.size > maxSize) {
      throw new BadRequestException('Fichier verso trop volumineux. Taille maximum: 5MB');
    }
  }
}
