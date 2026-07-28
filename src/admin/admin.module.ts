import { Module } from '@nestjs/common';

import { AgeCategoryModule } from '@age-category/age-category.module';
import { RoleModule } from '@role/role.module';
import { UserModule } from '@user/user.module';
import { WeightCategoryModule } from '@weight-category/weight-category.module';

import { AgeCategoryController } from './age-category/age-category.controller';
import { RoleController } from './role/role.controller';
import { RatingController } from './user/controllers/rating.controller';
import { UserController } from './user/controllers/user.controller';
import { WeightCategoryController } from './weight-category/weight-category.controller';

@Module({
    imports: [UserModule, RoleModule, AgeCategoryModule, WeightCategoryModule],
    controllers: [
        UserController,
        RatingController,
        RoleController,
        AgeCategoryController,
        WeightCategoryController
    ]
})
export class AdminModule {}
