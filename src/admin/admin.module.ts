import { Module } from '@nestjs/common';
import { UserModule } from '@user/user.module';
import { UserController } from './user/user.controller';
import { RoleController } from './role/role.controller';
import { RoleModule } from '@role/role.module';

@Module({
    imports: [UserModule, RoleModule],
    controllers: [UserController, RoleController]
})
export class AdminModule {}
