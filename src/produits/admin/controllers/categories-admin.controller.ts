import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoriesAdminService } from '../services/categories-admin.service';
import { CreateCategorieDto } from '../dto/create-categorie.dto';
import { UpdateCategorieDto } from '../dto/update-categorie.dto';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { AdminGuard } from '../../../users/guards/admin.guard';

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CategoriesAdminController {
    constructor(private readonly categoriesService: CategoriesAdminService) { }

    @Post()
    create(@Body() createCategorieDto: CreateCategorieDto) {
        return this.categoriesService.create(createCategorieDto);
    }

    @Get()
    findAll() {
        return this.categoriesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.categoriesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateCategorieDto: UpdateCategorieDto) {
        return this.categoriesService.update(id, updateCategorieDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.categoriesService.remove(id);
    }

    @Get('branche/:brancheId')
    findByBranche(@Param('brancheId') brancheId: string) {
        return this.categoriesService.findByBranche(brancheId);
    }
}
