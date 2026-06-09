import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class BeltService {
    constructor(private readonly prismaService: PrismaService) {}

    async findAll() {
        const belts = await this.prismaService.belt.findMany();
        return { belts };
    }
}
