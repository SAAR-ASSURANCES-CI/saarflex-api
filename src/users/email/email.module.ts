import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
import { EmailTemplateManagementService } from './email-template-management.service';
import { EmailMessagingController } from './email-messaging.controller';
import { EmailTemplateController } from './email-template.controller';
import { EmailTemplate } from './entities/email-template.entity';
import { UsersModule } from '../users.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([EmailTemplate]),
    forwardRef(() => UsersModule),
  ],
  controllers: [EmailMessagingController, EmailTemplateController],
  providers: [EmailService, EmailTemplateService, EmailTemplateManagementService],
  exports: [EmailService, EmailTemplateService, EmailTemplateManagementService],
})
export class EmailModule { }