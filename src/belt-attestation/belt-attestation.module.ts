import { Module } from '@nestjs/common';
import { BeltAttestationService } from './belt-attestation.service';
import { BeltAttestationController } from './belt-attestation.controller';
import { UserModule } from '@user/user.module';
import { BeltModule } from '@belt/belt.module';

@Module({
    imports: [UserModule, BeltModule],
    controllers: [BeltAttestationController],
    providers: [BeltAttestationService]
})
export class BeltAttestationModule {}
