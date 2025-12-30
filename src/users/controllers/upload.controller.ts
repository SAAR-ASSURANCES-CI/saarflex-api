import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService } from '../services/upload.service';
import { UploadImagesResponseDto, UploadErrorResponseDto } from '../dto/upload.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';

@ApiTags('Upload de fichiers')
@Controller('profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post('upload/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload de la photo de profil',
    description: 'Upload de la photo de profil de l\'utilisateur connecté'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Fichier image pour l\'avatar',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier image (JPG, PNG, WebP)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Avatar uploadé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou erreur de validation du fichier',
  })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any
  ): Promise<{ status: string; avatar_path: string }> {
    if (!file) {
      throw new BadRequestException('Un fichier est requis');
    }

    this.uploadService.validateFile(file, 'Photo de profil');

    const result = await this.uploadService.uploadAvatar(req.user.id, file);

    return {
      status: 'success',
      ...result
    };
  }

  @Post('upload/images')
  @UseInterceptors(FilesInterceptor('files', 2))
  @ApiOperation({
    summary: 'Upload des photos de carte d\'identité',
    description: 'Upload des photos recto et verso de la carte d\'identité de l\'utilisateur connecté'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Fichiers images de la carte d\'identité',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Fichiers images (recto et verso de la carte d\'identité)',
          minItems: 2,
          maxItems: 2,
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Photos uploadées avec succès',
    type: UploadImagesResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou erreur de validation des fichiers',
    type: UploadErrorResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur interne du serveur'
  })
  async uploadIdentityPhotos(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any
  ): Promise<UploadImagesResponseDto> {
    if (!files || files.length !== 2) {
      throw new BadRequestException('Deux fichiers sont requis: recto et verso de la carte d\'identité');
    }

    const [rectoFile, versoFile] = files;

    this.uploadService.validateFiles(rectoFile, versoFile);

    return this.uploadService.uploadIdentityPhotos(
      req.user.id,
      rectoFile,
      versoFile
    );
  }

  @Post('devis/:devisId/upload/assure-images')
  @UseInterceptors(FilesInterceptor('files', 2))
  @ApiOperation({
    summary: 'Upload des photos de carte d\'identité de l\'assuré',
    description: 'Upload des photos recto et verso de la carte d\'identité de l\'assuré (quand assuré ≠ souscripteur)'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Fichiers images de la carte d\'identité de l\'assuré',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Fichiers images (recto et verso de la carte d\'identité de l\'assuré)',
          minItems: 2,
          maxItems: 2,
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Photos de l\'assuré uploadées avec succès',
    type: UploadImagesResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou erreur de validation des fichiers',
    type: UploadErrorResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: 404,
    description: 'Devis non trouvé ou vous n\'avez pas les droits'
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur interne du serveur'
  })
  async uploadAssureIdentityPhotos(
    @Param('devisId') devisId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any
  ): Promise<UploadImagesResponseDto> {
    // Vérifier qu'on a exactement 2 fichiers
    if (!files || files.length !== 2) {
      throw new BadRequestException('Deux fichiers sont requis: recto et verso de la carte d\'identité');
    }

    const [rectoFile, versoFile] = files;

    // Valider les fichiers
    this.uploadService.validateFiles(rectoFile, versoFile);

    // Upload des fichiers de l'assuré
    return this.uploadService.uploadAssureIdentityPhotos(
      devisId,
      req.user.id,
      rectoFile,
      versoFile
    );
  }
}
