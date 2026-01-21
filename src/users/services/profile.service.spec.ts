import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { User, UserType } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DateUtilsService } from '../utils/date-utils.service';
import { UserManagementService } from './user-management.service';
import { ConflictException } from '@nestjs/common';

describe('ProfileService', () => {
    let service: ProfileService;
    let userRepository: Repository<User>;
    let profileRepository: Repository<Profile>;
    let userManagementService: UserManagementService;
    let dateUtilsService: DateUtilsService;

    const mockUserRepository = () => ({
        findOne: jest.fn(),
        save: jest.fn(),
    });

    const mockProfileRepository = () => ({
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    });

    const mockDateUtilsService = () => ({
        formatDateDDMMYYYY: jest.fn().mockReturnValue('01/01/1990'),
        validateBirthDate: jest.fn().mockReturnValue(new Date('1990-01-01')),
        validateExpirationDate: jest.fn().mockReturnValue(new Date('2030-01-01')),
    });

    const mockUserManagementService = () => ({
        findById: jest.fn(),
    });

    const mockConfigService = () => ({
        get: jest.fn((key, defaultValue) => {
            if (key === 'APP_URL') return 'http://localhost:3000';
            return defaultValue;
        }),
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProfileService,
                { provide: getRepositoryToken(User), useFactory: mockUserRepository },
                { provide: getRepositoryToken(Profile), useFactory: mockProfileRepository },
                { provide: DateUtilsService, useFactory: mockDateUtilsService },
                { provide: UserManagementService, useFactory: mockUserManagementService },
                { provide: ConfigService, useFactory: mockConfigService },
            ],
        }).compile();

        service = module.get<ProfileService>(ProfileService);
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        profileRepository = module.get<Repository<Profile>>(getRepositoryToken(Profile));
        userManagementService = module.get<UserManagementService>(UserManagementService);
        dateUtilsService = module.get<DateUtilsService>(DateUtilsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getProfile', () => {
        it('should return the full profile of a user', async () => {
            const user = { id: 'uuid', nom: 'John Doe', email: 'john@example.com' } as User;
            const profile = { user_id: user.id, adresse: 'Abidjan' } as Profile;

            (userManagementService.findById as jest.Mock).mockResolvedValue(user);
            (profileRepository.findOne as jest.Mock).mockResolvedValue(profile);

            const result = await service.getProfile('uuid');

            expect(userManagementService.findById).toHaveBeenCalledWith('uuid');
            expect(result.nom).toBe(user.nom);
            expect(result.adresse).toBe(profile.adresse);
        });

        it('should create a profile if it does not exist', async () => {
            const user = { id: 'uuid', nom: 'New User' } as User;
            (userManagementService.findById as jest.Mock).mockResolvedValue(user);
            (profileRepository.findOne as jest.Mock).mockResolvedValue(null);
            (profileRepository.create as jest.Mock).mockReturnValue({ user_id: 'uuid' });
            (profileRepository.save as jest.Mock).mockResolvedValue({ user_id: 'uuid' });

            await service.getProfile('uuid');

            expect(profileRepository.create).toHaveBeenCalledWith({ user_id: 'uuid' });
            expect(profileRepository.save).toHaveBeenCalled();
        });
    });

    describe('updateProfile', () => {
        it('should update user and profile successfully', async () => {
            const user = { id: 'uuid', nom: 'Old Name' } as User;
            const profile = { user_id: 'uuid' } as Profile;
            const updateDto = { nom: 'New Name', adresse: 'New Address' };

            (userManagementService.findById as jest.Mock).mockResolvedValue(user);
            (profileRepository.findOne as jest.Mock).mockResolvedValue(profile);
            (userRepository.save as jest.Mock).mockResolvedValue({ ...user, nom: 'New Name' });
            (profileRepository.save as jest.Mock).mockResolvedValue({ ...profile, adresse: 'New Address' });

            const result = await service.updateProfile('uuid', updateDto);

            expect(user.nom).toBe('New Name');
            expect(profile.adresse).toBe('New Address');
            expect(result.nom).toBe('New Name');
            expect(result.adresse).toBe('New Address');
        });

        it('should throw ConflictException if telephone is already used by another user', async () => {
            const user = { id: 'uuid', telephone: '0102030405' } as User;
            const updateDto = { telephone: '0607080910' };

            (userManagementService.findById as jest.Mock).mockResolvedValue(user);
            (userRepository.findOne as jest.Mock).mockResolvedValue({ id: 'other-uuid' });

            await expect(service.updateProfile('uuid', updateDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('getFileUrl', () => {
        it('should return an absolute URL for a path', () => {
            const path = 'profile/avatar.png';
            const result = service.getFileUrl(path);
            expect(result).toBe('http://localhost:3000/uploads/profile/avatar.png');
        });

        it('should return the path as is if it is already an HTTP URL', () => {
            const path = 'http://example.com/image.png';
            const result = service.getFileUrl(path);
            expect(result).toBe(path);
        });

        it('should return null if path is null', () => {
            expect(service.getFileUrl(null)).toBeNull();
        });
    });
});
