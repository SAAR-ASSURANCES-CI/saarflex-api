import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
import { EmailMessagingController } from './email-messaging.controller';
import { UsersModule } from '../users.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [EmailMessagingController],
  providers: [EmailService, EmailTemplateService],
  exports: [EmailService, EmailTemplateService],
})
export class EmailModule { }