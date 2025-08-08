import {
    Controller,
    Post,
    Body,
    HttpStatus,
    HttpException,
    Get,
    Param,
    UseGuards,
    Request,
    Ip,
    Headers,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) { }

    /**
     * Inscription d'un nouvel utilisateur via HTTP.
     * @param registerDto Données d'inscription de l'utilisateur
     * @param ipAddress Adresse IP de l'utilisateur
     * @param userAgent User agent de l'utilisateur
     * @returns Un objet contenant le statut, un message et les données du nouvel utilisateur (RegisterResponseDto)
     */
    @Post('register')
    @ApiOperation({
        summary: 'Inscription d\'un nouvel utilisateur',
        description: 'Créer un nouveau compte utilisateur avec validation des données et génération automatique du token JWT',
    })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({
        status: 201,
        description: 'Utilisateur créé avec succès avec token JWT',
        type: RegisterResponseDto,
    })
    @ApiResponse({
        status: 409,
        description: 'Email ou téléphone déjà utilisé',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'error' },
                message: { type: 'string', example: 'Un utilisateur avec cet email existe déjà' },
                statusCode: { type: 'number', example: 409 }
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Données invalides',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'error' },
                message: { type: 'array', items: { type: 'string' } },
                statusCode: { type: 'number', example: 400 }
            }
        }
    })
    async register(
        @Body() registerDto: RegisterDto,
        @Ip() ipAddress: string,
    ): Promise<{
        status: string;
        message: string;
        data: RegisterResponseDto;
    }> {
        try {
            const newUser = await this.userService.register(
                registerDto,
                ipAddress,
            );

            return {
                status: 'success',
                message: 'Utilisateur créé avec succès',
                data: newUser,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                {
                    status: 'error',
                    message: 'Erreur lors de la création du compte',
                    error: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Inscription d'un nouvel utilisateur via microservice (MessagePattern).
     * @param data Objet contenant registerDto, ipAddress et userAgent
     * @returns Un objet avec success (boolean), data (RegisterResponseDto) ou error (string)
     */
    @MessagePattern('user.register')
    async handleUserRegister(@Payload() data: {
        registerDto: RegisterDto;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        success: boolean;
        data?: RegisterResponseDto;
        error?: string;
    }> {
        try {
            const newUser = await this.userService.register(
                data.registerDto,
                data.ipAddress,
                data.userAgent
            );
            return {
                success: true,
                data: newUser,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Recherche un utilisateur par son ID via microservice.
     * @param userId ID de l'utilisateur
     * @returns Un objet avec success (boolean), data (utilisateur sans mot de passe) ou error (string)
     */
    @MessagePattern('user.findById')
    async handleFindById(@Payload() userId: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }> {
        try {
            const user = await this.userService.findById(userId);
            const { mot_de_passe, ...userWithoutPassword } = user;

            return {
                success: true,
                data: userWithoutPassword,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Recherche un utilisateur par son email via microservice.
     * @param email Email de l'utilisateur
     * @returns Un objet avec success (boolean), data (utilisateur) ou error (string)
     */
    @MessagePattern('user.findByEmail')
    async handleFindByEmail(@Payload() email: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }> {
        try {
            const user = await this.userService.findByEmail(email);

            if (!user) {
                return {
                    success: false,
                    error: 'Utilisateur non trouvé',
                };
            }

            return {
                success: true,
                data: user,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Met à jour la date de dernière connexion d'un utilisateur via microservice.
     * @param userId ID de l'utilisateur
     * @returns Un objet avec success (boolean) et éventuellement error (string)
     */
    @MessagePattern('user.updateLastLogin')
    async handleUpdateLastLogin(@Payload() userId: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            await this.userService.updateLastLogin(userId);
            return {
                success: true,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Vérifie si un email existe déjà via microservice.
     * @param email Email à vérifier
     * @returns Un objet avec success (boolean), exists (boolean) et éventuellement error (string)
     */
    @MessagePattern('user.emailExists')
    async handleEmailExists(@Payload() email: string): Promise<{
        success: boolean;
        exists: boolean;
        error?: string;
    }> {
        try {
            const exists = await this.userService.emailExists(email);
            return {
                success: true,
                exists,
            };
        } catch (error) {
            return {
                success: false,
                exists: false,
                error: error.message,
            };
        }
    }

    /**
     * Invalide une session spécifique via microservice.
     * @param sessionId ID de la session à invalider
     * @returns Un objet avec success (boolean) et éventuellement error (string)
     */
    @MessagePattern('user.invalidateSession')
    async handleInvalidateSession(@Payload() sessionId: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            await this.userService.invalidateSession(sessionId);
            return {
                success: true,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Invalide toutes les sessions d'un utilisateur via microservice.
     * @param userId ID de l'utilisateur
     * @returns Un objet avec success (boolean) et éventuellement error (string)
     */
    @MessagePattern('user.invalidateAllUserSessions')
    async handleInvalidateAllUserSessions(@Payload() userId: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            await this.userService.invalidateAllUserSessions(userId);
            return {
                success: true,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
}