import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminOrAgentGuard } from '../guards/admin-or-agent.guard';
import { EmailTemplateManagementService } from './email-template-management.service';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from './dto/email-template.dto';

@ApiTags('Email Templates')
@Controller('email-templates')
@ApiBearerAuth()
export class EmailTemplateController {
    constructor(private readonly templateService: EmailTemplateManagementService) { }

    @Post()
    @UseGuards(JwtAuthGuard, AdminOrAgentGuard)
    @ApiOperation({ summary: 'Créer un nouveau modèle d\'email' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Modèle créé avec succès' })
    create(@Body() createDto: CreateEmailTemplateDto) {
        return this.templateService.create(createDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, AdminOrAgentGuard)
    @ApiOperation({ summary: 'Liste des modèles d\'emails' })
    findAll() {
        return this.templateService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, AdminOrAgentGuard)
    @ApiOperation({ summary: 'Détails d\'un modèle' })
    findOne(@Param('id') id: string) {
        return this.templateService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, AdminOrAgentGuard)
    @ApiOperation({ summary: 'Modifier un modèle d\'email' })
    update(@Param('id') id: string, @Body() updateDto: UpdateEmailTemplateDto) {
        return this.templateService.update(id, updateDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiOperation({ summary: 'Supprimer un modèle d\'email (Admin)' })
    remove(@Param('id') id: string) {
        return this.templateService.remove(id);
    }
}
