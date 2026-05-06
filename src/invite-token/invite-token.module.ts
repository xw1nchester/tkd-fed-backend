import { Module } from '@nestjs/common';
import { InviteTokenService } from './invite-token.service';
import { InviteTokenController } from './invite-token.controller';

@Module({
  controllers: [InviteTokenController],
  providers: [InviteTokenService],
  exports: [InviteTokenService],
})
export class InviteTokenModule {}
