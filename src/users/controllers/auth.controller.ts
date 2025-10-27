import {
    Controller,
    Post,
    Body,
    HttpStatus,
    HttpException,
    Ip,
    UseGuards,
    Request,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from '../users.service';
import { RegisterDto, RegisterResponseDto } from '../dto/register.dto';
import { LoginDto, LoginResponseDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';

/**
 * Contrôleur responsable des endpoints d'authentification
 */
@ApiTags('Authentication')
@Controller('users')
export class AuthController {
    constructor(private readonly userService: UsersService) {}

    /**
     * Inscription d'un nouvel utilisateur
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
     * Connexion d'un utilisateur
     */
    @Post('login')
    @ApiOperation({
        summary: 'Connexion utilisateur',
        description: 'Vérifie les identifiants, génère un token JWT, crée une session et renvoie les informations de connexion.'
    })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Connexion réussie', type: LoginResponseDto })
    @ApiResponse({ status: 400, description: 'Identifiants invalides' })
    @ApiResponse({ status: 403, description: 'Compte bloqué' })
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
     * Démarre le flux mot de passe oublié: envoie un code OTP 6 chiffres (expire en 15 min)
     */
    @Post('forgot-password')
    @ApiOperation({ summary: 'Mot de passe oublié - envoi du code OTP' })
    @ApiBody({ type: ForgotPasswordDto })
    @ApiResponse({ status: 200, description: 'Code envoyé si le compte existe' })
    async forgotPassword(
        @Body() dto: ForgotPasswordDto
    ): Promise<{ status: string; message: string; }> {
        await this.userService.forgotPassword(dto);
        return { 
            status: 'success', 
            message: 'Si un compte existe pour cet email, un code a été envoyé.' 
        };
    }

    /**
     * Vérifie un code OTP
     */
    @Post('verify-otp')
    @ApiOperation({ summary: 'Vérifier le code OTP' })
    @ApiBody({ type: VerifyOtpDto })
    @ApiResponse({ status: 200, description: 'Code valide' })
    @ApiResponse({ status: 400, description: 'Code invalide ou expiré' })
    async verifyOtp(
        @Body() dto: VerifyOtpDto
    ): Promise<{ status: string; message: string; }> {
        await this.userService.verifyOtp(dto);
        return { status: 'success', message: 'Code valide' };
    }

    /**
     * Réinitialise le mot de passe via code OTP
     */
    @Post('reset-password')
    @ApiOperation({ summary: 'Réinitialiser le mot de passe via code OTP' })
    @ApiBody({ type: ResetPasswordDto })
    @ApiResponse({ status: 200, description: 'Mot de passe mis à jour' })
    @ApiResponse({ status: 400, description: 'Code invalide ou expiré' })
    async resetPassword(
        @Body() dto: ResetPasswordDto
    ): Promise<{ status: string; message: string; }> {
        await this.userService.resetPassword(dto);
        return { status: 'success', message: 'Mot de passe mis à jour avec succès' };
    }

    /**
     * Déconnexion de l'utilisateur
     */
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Déconnexion utilisateur',
        description: 'Invalide toutes les sessions actives de l\'utilisateur connecté'
    })
    @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    async logout(
        @Request() req: any
    ): Promise<{ status: string; message: string }> {
        try {
            const userId = req.user?.id;
            await this.userService.invalidateAllUserSessions(userId);
            return {
                status: 'success',
                message: 'Déconnexion réussie'
            };
        } catch (error) {
            throw new HttpException(
                {
                    status: 'error',
                    message: 'Erreur lors de la déconnexion',
                    error: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}

