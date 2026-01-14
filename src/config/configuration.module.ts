import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationSysteme } from './entities/configuration-systeme.entity';
import { ConfigurationService } from './services/configuration.service';
import { ConfigurationController } from './controllers/configuration.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ConfigurationSysteme]),
        forwardRef(() => UsersModule)
    ],
    controllers: [ConfigurationController],
    providers: [ConfigurationService],
    exports: [ConfigurationService],
})
export class ConfigurationModule { }
