import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class RoleService {
    constructor(private readonly prismaService: PrismaService) {}

    async findAll() {
        const roles = await this.prismaService.role.findMany();
        return { roles };
    }
}
