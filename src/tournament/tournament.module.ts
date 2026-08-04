import { Module } from '@nestjs/common';

import { PrismaModule } from '@prisma/prisma.module';
import { UserModule } from '@user/user.module';
import { WeightCategoryModule } from '@weight-category/weight-category.module';
import { FileModule } from '@file/file.module';

import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';

@Module({
    imports: [PrismaModule, UserModule, WeightCategoryModule, FileModule],
    controllers: [TournamentController],
    providers: [TournamentService]
})
export class TournamentModule {}
