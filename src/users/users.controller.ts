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

    @Post('register')
    @ApiOperation({
        summary: 'Inscription d\'un nouvel utilisateur',
        description: 'Créer un nouveau compte utilisateur avec validation des données',
    })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({
        status: 201,
        description: 'Utilisateur créé avec succès',
        type: RegisterResponseDto,
    })
    @ApiResponse({
        status: 409,
        description: 'Email ou téléphone déjà utilisé',
    })
    @ApiResponse({
        status: 400,
        description: 'Données invalides',
    })
    async register(@Body() registerDto: RegisterDto): Promise<{
        status: string;
        message: string;
        data: RegisterResponseDto;
    }> {
        try {
            const newUser = await this.userService.register(registerDto);

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

    @Get(':id')
    @ApiOperation({
        summary: 'Obtenir un utilisateur par ID',
        description: 'Récupérer les informations d\'un utilisateur spécifique',
    })
    @ApiResponse({
        status: 200,
        description: 'Utilisateur trouvé',
    })
    @ApiResponse({
        status: 404,
        description: 'Utilisateur non trouvé',
    })
    async findById(@Param('id') id: string): Promise<{
        status: string;
        data: any;
    }> {
        try {
            const user = await this.userService.findById(id);

            const { mot_de_passe, ...userWithoutPassword } = user;

            return {
                status: 'success',
                data: userWithoutPassword,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                {
                    status: 'error',
                    message: 'Erreur lors de la récupération de l\'utilisateur',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('stats/overview')
    @ApiOperation({
        summary: 'Statistiques des utilisateurs',
        description: 'Obtenir les statistiques générales des utilisateurs (admin)',
    })
    @ApiResponse({
        status: 200,
        description: 'Statistiques récupérées avec succès',
    })
    async getStats(): Promise<{
        status: string;
        data: any;
    }> {
        try {
            const stats = await this.userService.getUserStats();

            return {
                status: 'success',
                data: stats,
            };
        } catch (error) {
            throw new HttpException(
                {
                    status: 'error',
                    message: 'Erreur lors de la récupération des statistiques',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }


    @MessagePattern('user.register')
    async handleUserRegister(@Payload() registerDto: RegisterDto): Promise<{
        success: boolean;
        data?: RegisterResponseDto;
        error?: string;
    }> {
        try {
            const newUser = await this.userService.register(registerDto);
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
}