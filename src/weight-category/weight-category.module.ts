import { Module } from '@nestjs/common';

import { WeightCategoryController } from './weight-category.controller';
import { WeightCategoryService } from './weight-category.service';

@Module({
    controllers: [WeightCategoryController],
    providers: [WeightCategoryService],
    exports: [WeightCategoryService]
})
export class WeightCategoryModule {}
