import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class BeltService {
    constructor(private readonly prismaService: PrismaService) {}

    async findAll() {
        const belts = await this.prismaService.belt.findMany();
        return { belts };
    }

    async exists(id: number) {
        const count = await this.prismaService.belt.count({ where: { id } });
        return count > 0;
    }
}
