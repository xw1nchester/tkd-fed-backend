import { Module } from '@nestjs/common';

import { BeltModule } from '@belt/belt.module';
import { UserModule } from '@user/user.module';

import { BeltAttestationController } from './belt-attestation.controller';
import { BeltAttestationService } from './belt-attestation.service';

@Module({
    imports: [UserModule, BeltModule],
    controllers: [BeltAttestationController],
    providers: [BeltAttestationService]
})
export class BeltAttestationModule {}
