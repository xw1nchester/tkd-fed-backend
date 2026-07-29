import { Module } from '@nestjs/common';

import { PrismaModule } from '@prisma/prisma.module';
import { UserModule } from '@user/user.module';
import { WeightCategoryModule } from '@weight-category/weight-category.module';

import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';

@Module({
    imports: [PrismaModule, UserModule, WeightCategoryModule],
    controllers: [TournamentController],
    providers: [TournamentService]
})
export class TournamentModule {}
