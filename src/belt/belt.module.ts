import { Module } from '@nestjs/common';

import { BeltController } from './belt.controller';
import { BeltService } from './belt.service';

@Module({
    controllers: [BeltController],
    providers: [BeltService],
    exports: [BeltService]
})
export class BeltModule {}
