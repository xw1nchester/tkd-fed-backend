import { Injectable, NotFoundException } from '@nestjs/common';

import { AgeCategoryRequestDto } from '@admin/age-category/dto/age-category-request.dto';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class AgeCategoryService {
    constructor(private readonly prismaService: PrismaService) {}

    async findAll() {
        const ageCategories = await this.prismaService.ageCategory.findMany();
        return { ageCategories };
    }

    async getById(id: number) {
        const ageCategory = await this.prismaService.ageCategory.findUnique({
            where: { id }
        });
        if (!ageCategory) {
            throw new NotFoundException('Возрастная категория не найдена');
        }
        return ageCategory;
    }

    async getDtoById(id: number) {
        const ageCategory = await this.getById(id);
        return { ageCategory };
    }

    async create(dto: AgeCategoryRequestDto) {
        const ageCategory = await this.prismaService.ageCategory.create({
            data: dto
        });
        return { ageCategory };
    }

    async update(id: number, dto: AgeCategoryRequestDto) {
        await this.getById(id);
        const ageCategory = await this.prismaService.ageCategory.update({
            where: { id },
            data: dto
        });
        return { ageCategory };
    }

    async remove(id: number) {
        await this.getById(id);
        const ageCategory = await this.prismaService.ageCategory.delete({
            where: { id }
        });
        return { ageCategory };
    }
}
