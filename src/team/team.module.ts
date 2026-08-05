import { Module } from '@nestjs/common';

import { FileModule } from '@file/file.module';
import { UserModule } from '@user/user.module';

import { TeamController } from './team.controller';
import { TeamService } from './team.service';

@Module({
    imports: [UserModule, FileModule],
    controllers: [TeamController],
    providers: [TeamService]
})
export class TeamModule {}
