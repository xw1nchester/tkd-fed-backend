import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma-client';
import { DetailedUserInfoRequestDto } from '@user/dto/detailed-user-info-request.dto';
import {
    IsEnum,
    IsOptional,
    IsString,
} from 'class-validator';

export class AdminDetailedUserInfoRequestDto extends DetailedUserInfoRequestDto {
    @ApiProperty({
        enum: VerificationStatus,
        example: VerificationStatus.APPROVED
    })
    @IsEnum(VerificationStatus)
    status: VerificationStatus;

    @ApiProperty({ example: 'Не видно цифры' })
    @IsString()
    @IsOptional()
    comment: string;
}
