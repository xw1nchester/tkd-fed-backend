import { Module } from '@nestjs/common';
import { BeltService } from './belt.service';
import { BeltController } from './belt.controller';

@Module({
  controllers: [BeltController],
  providers: [BeltService],
  exports: [BeltService],
})
export class BeltModule {}
