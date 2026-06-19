import { Module } from '@nestjs/common';
import { UserModule } from '@user/user.module';
import { UserController } from './user/controllers/user.controller';
import { RoleController } from './role/role.controller';
import { RoleModule } from '@role/role.module';
import { RatingController } from './user/controllers/rating.controller';

@Module({
    imports: [UserModule, RoleModule],
    controllers: [UserController, RatingController, RoleController]
})
export class AdminModule {}
