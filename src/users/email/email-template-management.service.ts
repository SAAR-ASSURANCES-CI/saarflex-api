import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from './entities/email-template.entity';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from './dto/email-template.dto';

@Injectable()
export class EmailTemplateManagementService {
    constructor(
        @InjectRepository(EmailTemplate)
        private readonly templateRepository: Repository<EmailTemplate>,
    ) { }

    async create(createDto: CreateEmailTemplateDto): Promise<EmailTemplate> {
        const existing = await this.templateRepository.findOne({ where: { name: createDto.name } });
        if (existing) {
            throw new ConflictException(`Un modèle avec le nom "${createDto.name}" existe déjà.`);
        }
        const template = this.templateRepository.create(createDto);
        return this.templateRepository.save(template);
    }

    async findAll(): Promise<EmailTemplate[]> {
        return this.templateRepository.find({
            order: { name: 'ASC' },
            where: { isActive: true }
        });
    }

    async findOne(id: string): Promise<EmailTemplate> {
        const template = await this.templateRepository.findOne({ where: { id } });
        if (!template) {
            throw new NotFoundException(`Modèle #${id} introuvable.`);
        }
        return template;
    }

    async update(id: string, updateDto: UpdateEmailTemplateDto): Promise<EmailTemplate> {
        const template = await this.findOne(id);

        if (updateDto.name && updateDto.name !== template.name) {
            const existing = await this.templateRepository.findOne({ where: { name: updateDto.name } });
            if (existing) {
                throw new ConflictException(`Un modèle avec le nom "${updateDto.name}" existe déjà.`);
            }
        }

        Object.assign(template, updateDto);
        return this.templateRepository.save(template);
    }

    async remove(id: string): Promise<void> {
        const template = await this.findOne(id);
        await this.templateRepository.remove(template);
    }
}
