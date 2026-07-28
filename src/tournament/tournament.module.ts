import { Module } from '@nestjs/common';

import { PrismaModule } from '@prisma/prisma.module';

import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';

@Module({
    imports: [PrismaModule],
    controllers: [TournamentController],
    providers: [TournamentService]
})
export class TournamentModule {}
