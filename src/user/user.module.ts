import { Module } from '@nestjs/common';

import { BeltModule } from '@belt/belt.module';
import { FileModule } from '@file/file.module';
import { SportRankModule } from '@sport-rank/sport-rank.module';

import { RatingService } from './services/rating.service';
import { UserService } from './services/user.service';
import { UserController } from './user.controller';

@Module({
    imports: [FileModule, BeltModule, SportRankModule],
    controllers: [UserController],
    providers: [UserService, RatingService],
    exports: [UserService, RatingService]
})
export class UserModule {}
