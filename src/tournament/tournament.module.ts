import { Module } from '@nestjs/common';

import { PrismaModule } from '@prisma/prisma.module';

import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';
import { UserModule } from '@user/user.module';
import { WeightCategoryModule } from '@weight-category/weight-category.module';

@Module({
    imports: [PrismaModule, UserModule, WeightCategoryModule],
    controllers: [TournamentController],
    providers: [TournamentService]
})
export class TournamentModule {}
