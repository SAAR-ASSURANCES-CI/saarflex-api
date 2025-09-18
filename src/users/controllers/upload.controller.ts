import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
  constructor(private readonly uploadService: UploadService) {}

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
}
