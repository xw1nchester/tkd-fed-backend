import { Module } from '@nestjs/common';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { FileModule } from '@file/file.module';
import { BeltModule } from '@belt/belt.module';
import { SportRankModule } from '@sport-rank/sport-rank.module';

@Module({
    imports: [FileModule, BeltModule, SportRankModule],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService]
})
export class UserModule {}
