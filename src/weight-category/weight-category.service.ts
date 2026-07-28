import { Injectable, NotFoundException } from '@nestjs/common';

import { WeightCategoryRequestDto } from '@admin/weight-category/dto/weight-category-request.dto';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class WeightCategoryService {
    constructor(private readonly prismaService: PrismaService) {}

    async findAll() {
        const weightCategories =
            await this.prismaService.weightCategory.findMany();
        return { weightCategories };
    }

    async getById(id: number) {
        const weightCategory =
            await this.prismaService.weightCategory.findUnique({
                where: { id }
            });
        if (!weightCategory) {
            throw new NotFoundException('Весовая категория не найдена');
        }
        return weightCategory;
    }

    async getDtoById(id: number) {
        const weightCategory = await this.getById(id);
        return { weightCategory };
    }

    async create(dto: WeightCategoryRequestDto) {
        const weightCategory = await this.prismaService.weightCategory.create({
            data: dto
        });
        return { weightCategory };
    }

    async update(id: number, dto: WeightCategoryRequestDto) {
        await this.getById(id);
        const weightCategory = await this.prismaService.weightCategory.update({
            where: { id },
            data: dto
        });
        return { weightCategory };
    }

    async remove(id: number) {
        await this.getById(id);
        const weightCategory = await this.prismaService.weightCategory.delete({
            where: { id }
        });
        return { weightCategory };
    }

    async validateWeightCategoryIds(ids: number[]) {
        const weightCategories =
            await this.prismaService.weightCategory.findMany({
                where: { id: { in: ids } }
            });

        if (ids.length != weightCategories.length) {
            throw new NotFoundException('Весовая категория не найдена');
        }
    }
}
