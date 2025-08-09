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
import { LoginDto, LoginResponseDto } from './dto/login.dto';
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
     * Connexion d'un utilisateur via HTTP.
     * 
     * @param loginDto Les identifiants de connexion de l'utilisateur (email, mot de passe)
     * @param ipAddress L'adresse IP de l'utilisateur (injectée automatiquement)
     * @returns Un objet contenant :
     *   - status: 'success' si la connexion est réussie, sinon 'error'
     *   - message: un message de succès ou d'erreur
     *   - data: un objet LoginResponseDto contenant :
     *       - id: string (identifiant de l'utilisateur)
     *       - nom: string (nom de l'utilisateur)
     *       - email: string (email de l'utilisateur)
     *       - telephone?: string (téléphone de l'utilisateur, optionnel)
     *       - type_utilisateur: UserType (type d'utilisateur)
     *       - statut: boolean (statut du compte)
     *       - date_creation: Date (date de création du compte)
     *       - token: string (JWT généré)
     *       - token_type: string (ex: 'Bearer')
     *       - expires_in: number (durée de validité du token en secondes)
     *   En cas d'erreur, une exception HttpException est levée avec :
     *     - status: 'error'
     *     - message: message d'erreur
     *     - error: détail de l'erreur
     */
    @Post('login')
    @ApiOperation({
        summary: 'Connexion utilisateur',
        description: 'Vérifie les identifiants, génère un token JWT, crée une session et renvoie les informations de connexion.'
    })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Connexion réussie', type: LoginResponseDto })
    @ApiResponse({ status: 400, description: 'Identifiants invalides' })
    async login(
        @Body() loginDto: LoginDto,
        @Ip() ipAddress: string,
    ): Promise<{
        status: string;
        message: string;
        data: LoginResponseDto;
    }> {
        try {
            const result = await this.userService.login(loginDto, ipAddress);
            return {
                status: 'success',
                message: 'Connexion réussie',
                data: result,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                {
                    status: 'error',
                    message: 'Erreur lors de la connexion',
                    error: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Connexion via microservice (MessagePattern)
     */
    @MessagePattern('user.login')
    async handleUserLogin(@Payload() data: { loginDto: LoginDto; ipAddress?: string; userAgent?: string }): Promise<{
        success: boolean;
        data?: LoginResponseDto;
        error?: string;
    }> {
        try {
            const result = await this.userService.login(data.loginDto, data.ipAddress, data.userAgent);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
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