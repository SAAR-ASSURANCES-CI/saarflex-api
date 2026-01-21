import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User, UserType } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '../jwt/jwt.service';
import { EmailService } from '../email/email.service';
import { SessionService } from './session.service';
import { NotificationService } from './notification.service';
import { UserManagementService } from './user-management.service';
import { ProfileService } from './profile.service';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let userRepository: Repository<User>;
    let profileRepository: Repository<Profile>;
    let jwtService: JwtService;
    let emailService: EmailService;
    let sessionService: SessionService;
    let notificationService: NotificationService;
    let userManagementService: UserManagementService;
    let profileService: ProfileService;

    const mockUserRepository = () => ({
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    });

    const mockProfileRepository = () => ({
        findOne: jest.fn(),
        save: jest.fn(),
    });

    const mockJwtService = () => ({
        generateToken: jest.fn(),
    });

    const mockEmailService = () => ({
        sendWelcomeEmail: jest.fn(),
    });

    const mockSessionService = () => ({
        createSession: jest.fn(),
    });

    const mockNotificationService = () => ({
        createWelcomeNotification: jest.fn(),
    });

    const mockUserManagementService = () => ({
        findByEmail: jest.fn(),
        updateLastLogin: jest.fn(),
    });

    const mockProfileService = () => ({
        getFileUrl: jest.fn(),
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: getRepositoryToken(User), useFactory: mockUserRepository },
                { provide: getRepositoryToken(Profile), useFactory: mockProfileRepository },
                { provide: JwtService, useFactory: mockJwtService },
                { provide: EmailService, useFactory: mockEmailService },
                { provide: SessionService, useFactory: mockSessionService },
                { provide: NotificationService, useFactory: mockNotificationService },
                { provide: UserManagementService, useFactory: mockUserManagementService },
                { provide: ProfileService, useFactory: mockProfileService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        profileRepository = module.get<Repository<Profile>>(getRepositoryToken(Profile));
        jwtService = module.get<JwtService>(JwtService);
        emailService = module.get<EmailService>(EmailService);
        sessionService = module.get<SessionService>(SessionService);
        notificationService = module.get<NotificationService>(NotificationService);
        userManagementService = module.get<UserManagementService>(UserManagementService);
        profileService = module.get<ProfileService>(ProfileService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('register', () => {
        const registerDto = {
            nom: 'Test User',
            email: 'test@example.com',
            mot_de_passe: 'Password123!',
            telephone: '+2250102030405',
        };

        it('should successfully register a new user', async () => {
            const savedUser = {
                id: 'uuid',
                ...registerDto,
                mot_de_passe: 'hashed_password',
                type_utilisateur: UserType.CLIENT,
                statut: true,
                date_creation: new Date(),
            };

            userManagementService.findByEmail = jest.fn().mockResolvedValue(null);
            userRepository.findOne = jest.fn().mockResolvedValue(null);
            userRepository.create = jest.fn().mockReturnValue(savedUser);
            userRepository.save = jest.fn().mockResolvedValue(savedUser);
            jwtService.generateToken = jest.fn().mockReturnValue('token');

            const result = await service.register(registerDto);

            expect(userManagementService.findByEmail).toHaveBeenCalledWith(registerDto.email);
            expect(userRepository.save).toHaveBeenCalled();
            expect(jwtService.generateToken).toHaveBeenCalledWith(savedUser);
            expect(sessionService.createSession).toHaveBeenCalled();
            expect(notificationService.createWelcomeNotification).toHaveBeenCalled();

            expect(result).toHaveProperty('token', 'token');
            expect(result.email).toBe(registerDto.email);
        });

        it('should throw ConflictException if email already exists', async () => {
            userManagementService.findByEmail = jest.fn().mockResolvedValue({ id: 'existing' });

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
        });

        it('should throw ConflictException if phone already exists', async () => {
            userManagementService.findByEmail = jest.fn().mockResolvedValue(null);
            userRepository.findOne = jest.fn().mockResolvedValue({ id: 'existing' });

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        const loginDto = {
            email: 'test@example.com',
            mot_de_passe: 'Password123!',
        };

        const mockUser = {
            id: 'uuid',
            nom: 'Test User',
            email: 'test@example.com',
            mot_de_passe: 'hashed_password',
            statut: true,
            type_utilisateur: UserType.CLIENT,
            date_creation: new Date(),
        } as User;

        it('should successfully login with valid credentials', async () => {
            (userManagementService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwtService.generateToken as jest.Mock).mockReturnValue('token');
            (profileRepository.findOne as jest.Mock).mockResolvedValue(null);

            const result = await service.login(loginDto);

            expect(userManagementService.findByEmail).toHaveBeenCalledWith(loginDto.email);
            expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.mot_de_passe, mockUser.mot_de_passe);
            expect(jwtService.generateToken).toHaveBeenCalledWith(mockUser);
            expect(sessionService.createSession).toHaveBeenCalled();
            expect(result).toHaveProperty('token', 'token');
            expect(result.email).toBe(loginDto.email);
        });

        it('should throw UnauthorizedException if user not found', async () => {
            (userManagementService.findByEmail as jest.Mock).mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password invalid', async () => {
            (userManagementService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw ForbiddenException if account is blocked', async () => {
            (userManagementService.findByEmail as jest.Mock).mockResolvedValue({ ...mockUser, statut: false });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
        });
    });
});
