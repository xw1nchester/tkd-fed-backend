import { Module } from '@nestjs/common';

import { SportRankController } from './sport-rank.controller';
import { SportRankService } from './sport-rank.service';

@Module({
    controllers: [SportRankController],
    providers: [SportRankService],
    exports: [SportRankService]
})
export class SportRankModule {}
