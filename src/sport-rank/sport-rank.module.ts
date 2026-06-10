import { Module } from '@nestjs/common';
import { SportRankService } from './sport-rank.service';
import { SportRankController } from './sport-rank.controller';

@Module({
  controllers: [SportRankController],
  providers: [SportRankService],
  exports: [SportRankService],
})
export class SportRankModule {}
