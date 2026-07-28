import { Module } from '@nestjs/common';

import { InviteTokenController } from './invite-token.controller';
import { InviteTokenService } from './invite-token.service';

@Module({
    controllers: [InviteTokenController],
    providers: [InviteTokenService],
    exports: [InviteTokenService]
})
export class InviteTokenModule {}
