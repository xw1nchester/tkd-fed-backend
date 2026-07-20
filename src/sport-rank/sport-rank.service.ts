import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class SportRankService {
    constructor(private readonly prismaService: PrismaService) {}

    async findAll() {
        const sportRanks = await this.prismaService.sportRank.findMany();
        return { sportRanks };
    }

    async exists(id: number) {
        const count = await this.prismaService.sportRank.count({
            where: { id }
        });
        return count > 0;
    }
}
