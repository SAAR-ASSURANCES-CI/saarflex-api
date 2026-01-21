import { Test, TestingModule } from '@nestjs/testing';
import { PasswordResetService } from './password-reset.service';
import { User } from '../entities/user.entity';
import { PasswordReset } from '../entities/password-reset.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { SessionService } from './session.service';
import { UserManagementService } from './user-management.service';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('PasswordResetService', () => {
    let service: PasswordResetService;
    let userRepository: Repository<User>;
    let passwordResetRepository: Repository<PasswordReset>;
    let emailService: EmailService;
    let sessionService: SessionService;
    let userManagementService: UserManagementService;

    const mockUserRepository = () => ({
        update: jest.fn(),
    });

    const mockPasswordResetRepository = () => ({
        update: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
    });

    const mockEmailService = () => ({
        sendPasswordResetCode: jest.fn(),
    });

    const mockSessionService = () => ({
        invalidateAllUserSessions: jest.fn(),
    });

    const mockUserManagementService = () => ({
        findByEmail: jest.fn(),
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PasswordResetService,
                { provide: getRepositoryToken(User), useFactory: mockUserRepository },
                { provide: getRepositoryToken(PasswordReset), useFactory: mockPasswordResetRepository },
                { provide: EmailService, useFactory: mockEmailService },
                { provide: SessionService, useFactory: mockSessionService },
                { provide: UserManagementService, useFactory: mockUserManagementService },
            ],
        }).compile();

        service = module.get<PasswordResetService>(PasswordResetService);
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        passwordResetRepository = module.get<Repository<PasswordReset>>(getRepositoryToken(PasswordReset));
        emailService = module.get<EmailService>(EmailService);
        sessionService = module.get<SessionService>(SessionService);
        userManagementService = module.get<UserManagementService>(UserManagementService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('forgotPassword', () => {
        it('should generate an OTP and send an email if user exists', async () => {
            const user = { id: 'uuid', email: 'test@example.com' } as User;
            (userManagementService.findByEmail as jest.Mock).mockResolvedValue(user);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_code');

            await service.forgotPassword({ email: user.email });

            expect(passwordResetRepository.update).toHaveBeenCalled();
            expect(passwordResetRepository.create).toHaveBeenCalled();
            expect(passwordResetRepository.save).toHaveBeenCalled();
            expect(emailService.sendPasswordResetCode).toHaveBeenCalledWith(user.email, expect.any(String));
        });

        it('should do nothing if user does not exist', async () => {
            (userManagementService.findByEmail as jest.Mock).mockResolvedValue(null);

            await service.forgotPassword({ email: 'nonexistent@example.com' });

            expect(passwordResetRepository.save).not.toHaveBeenCalled();
            expect(emailService.sendPasswordResetCode).not.toHaveBeenCalled();
        });
    });

    describe('verifyOtp', () => {
        it('should verify OTP successfully', async () => {
            const user = { id: 'uuid', email: 'test@example.com' } as User;
            const resetRecord = {
                user_id: user.id,
                code_hash: 'hashed_code',
                expires_at: new Date(Date.now() + 10000)
            } as PasswordReset;

            (userManagementService.findByEmail as jest.Mock).mockResolvedValue(user);
            (passwordResetRepository.findOne as jest.Mock).mockResolvedValue(resetRecord);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(service.verifyOtp({ email: user.email, code: '123456' })).resolves.not.toThrow();
        });

        it('should throw BadRequestException for invalid code', async () => {
            const user = { id: 'uuid', email: 'test@example.com' } as User;
            (userManagementService.findByEmail as jest.Mock).mockResolvedValue(user);
            (passwordResetRepository.findOne as jest.Mock).mockResolvedValue({
                expires_at: new Date(Date.now() + 10000),
                code_hash: 'hashed'
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.verifyOtp({ email: user.email, code: 'wrong' })).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException for expired code', async () => {
            const user = { id: 'uuid', email: 'test@example.com' } as User;
            (userManagementService.findByEmail as jest.Mock).mockResolvedValue(user);
            (passwordResetRepository.findOne as jest.Mock).mockResolvedValue({
                expires_at: new Date(Date.now() - 10000)
            });

            await expect(service.verifyOtp({ email: user.email, code: '123456' })).rejects.toThrow(BadRequestException);
        });
    });

    describe('resetPassword', () => {
        it('should reset password and invalidate sessions', async () => {
            const user = { id: 'uuid', email: 'test@example.com' } as User;
            const resetRecord = {
                id: 'record-id',
                user_id: user.id,
                code_hash: 'hashed_code',
                expires_at: new Date(Date.now() + 10000)
            } as PasswordReset;

            (userManagementService.findByEmail as jest.Mock).mockResolvedValue(user);
            (passwordResetRepository.findOne as jest.Mock).mockResolvedValue(resetRecord);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');

            await service.resetPassword({
                email: user.email,
                code: '123456',
                nouveau_mot_de_passe: 'NewPassword123!'
            });

            expect(userRepository.update).toHaveBeenCalled();
            expect(passwordResetRepository.update).toHaveBeenCalledWith('record-id', expect.any(Object));
            expect(sessionService.invalidateAllUserSessions).toHaveBeenCalledWith(user.id);
        });
    });
});
