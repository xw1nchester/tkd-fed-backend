import { Module } from '@nestjs/common';

import { AgeCategoryController } from './age-category.controller';
import { AgeCategoryService } from './age-category.service';

@Module({
    controllers: [AgeCategoryController],
    providers: [AgeCategoryService],
    exports: [AgeCategoryService]
})
export class AgeCategoryModule {}
