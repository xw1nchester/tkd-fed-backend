import { Module } from '@nestjs/common';

import { UserController } from './user.controller';
import { UserService } from './services/user.service';
import { FileModule } from '@file/file.module';
import { BeltModule } from '@belt/belt.module';
import { SportRankModule } from '@sport-rank/sport-rank.module';
import { RatingService } from './services/rating.service';

@Module({
    imports: [FileModule, BeltModule, SportRankModule],
    controllers: [UserController],
    providers: [UserService, RatingService],
    exports: [UserService, RatingService]
})
export class UserModule {}
