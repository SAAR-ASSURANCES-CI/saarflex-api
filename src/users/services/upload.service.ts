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
      await this.cleanupUploadedFiles([rectoPath, versoPath]);
      throw error;
    }
  }

  /**
   * Upload de la photo de profil (Avatar)
   */
  async uploadAvatar(
    userId: string,
    avatarFile: Express.Multer.File
  ): Promise<{ avatar_path: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    const folderName = this.sanitizeFolderName(user.nom);
    const userFolderPath = path.join(this.uploadPath, folderName);

    this.ensureUserDirectoryExists(userFolderPath);

    let avatarPath: string | null = null;

    try {
      // Déterminer l'extension du fichier
      const extension = path.extname(avatarFile.originalname) || '.png';
      avatarPath = await this.saveFile(avatarFile, userFolderPath, `avatar${extension}`);

      await this.profileRepository.update(
        { user_id: userId },
        { avatar_path: avatarPath }
      );

      return {
        avatar_path: avatarPath
      };

    } catch (error) {
      await this.cleanupUploadedFiles([avatarPath]);
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
  private async cleanupUploadedFiles(filePaths: (string | null)[]): Promise<void> {
    const filesToDelete = filePaths.filter((path): path is string => path !== null);

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

    if (devis.assure_est_souscripteur) {
      throw new BadRequestException('Cet endpoint est réservé aux cas où l\'assuré est différent du souscripteur');
    }

    const folderName = `devis_${devisId}`;
    const devisFolderPath = path.join(this.uploadPath, 'assures', folderName);

    this.ensureUserDirectoryExists(devisFolderPath);

    let rectoPath: string | null = null;
    let versoPath: string | null = null;

    try {
      rectoPath = await this.saveFile(rectoFile, devisFolderPath, 'recto.png');

      versoPath = await this.saveFile(versoFile, devisFolderPath, 'verso.png');

      await this.devisSimuleRepository.update(devisId, {
        chemin_recto_assure: rectoPath,
        chemin_verso_assure: versoPath
      });

      return {
        recto_path: rectoPath,
        verso_path: versoPath
      };

    } catch (error) {
      await this.cleanupUploadedFiles([rectoPath, versoPath]);
      throw error;
    }
  }

  /**
   * Valide un seul fichier (ex: avatar)
   */
  validateFile(file: Express.Multer.File, fieldName: string = 'Fichier'): void {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!file) {
      throw new BadRequestException(`${fieldName} requis`);
    }
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Format de fichier non supporté pour ${fieldName}. Formats acceptés: JPEG, PNG, WebP`);
    }
    if (file.size > maxSize) {
      throw new BadRequestException(`${fieldName} trop volumineux. Taille maximum: 5MB`);
    }
  }

  /**
   * Valide les fichiers uploadés (recto/verso)
   */
  validateFiles(rectoFile: Express.Multer.File, versoFile: Express.Multer.File): void {
    this.validateFile(rectoFile, 'Photo recto de la carte d\'identité');
    this.validateFile(versoFile, 'Photo verso de la carte d\'identité');
  }
}
