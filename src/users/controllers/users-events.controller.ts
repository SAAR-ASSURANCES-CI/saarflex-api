import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from '../users.service';
import { RegisterDto, RegisterResponseDto } from '../dto/register.dto';
import { LoginDto, LoginResponseDto } from '../dto/login.dto';

/**
 * Contrôleur responsable des événements microservices (MessagePatterns)
 */
@Controller()
export class UsersEventsController {
    constructor(private readonly userService: UsersService) {}

    /**
     * Connexion via microservice (MessagePattern)
     */
    @MessagePattern('user.login')
    async handleUserLogin(
        @Payload() data: { 
            loginDto: LoginDto; 
            ipAddress?: string; 
            userAgent?: string 
        }
    ): Promise<{
        success: boolean;
        data?: LoginResponseDto;
        error?: string;
    }> {
        try {
            const result = await this.userService.login(
                data.loginDto, 
                data.ipAddress, 
                data.userAgent
            );
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Inscription d'un nouvel utilisateur via microservice (MessagePattern)
     */
    @MessagePattern('user.register')
    async handleUserRegister(
        @Payload() data: {
            registerDto: RegisterDto;
            ipAddress?: string;
            userAgent?: string;
        }
    ): Promise<{
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
     * Recherche un utilisateur par son ID via microservice
     */
    @MessagePattern('user.findById')
    async handleFindById(
        @Payload() userId: string
    ): Promise<{
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
     * Recherche un utilisateur par son email via microservice
     */
    @MessagePattern('user.findByEmail')
    async handleFindByEmail(
        @Payload() email: string
    ): Promise<{
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
     * Met à jour la date de dernière connexion d'un utilisateur via microservice
     */
    @MessagePattern('user.updateLastLogin')
    async handleUpdateLastLogin(
        @Payload() userId: string
    ): Promise<{
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
     * Vérifie si un email existe déjà via microservice
     */
    @MessagePattern('user.emailExists')
    async handleEmailExists(
        @Payload() email: string
    ): Promise<{
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
     * Invalide une session spécifique via microservice
     */
    @MessagePattern('user.invalidateSession')
    async handleInvalidateSession(
        @Payload() sessionId: string
    ): Promise<{
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
     * Invalide toutes les sessions d'un utilisateur via microservice
     */
    @MessagePattern('user.invalidateAllUserSessions')
    async handleInvalidateAllUserSessions(
        @Payload() userId: string
    ): Promise<{
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

