import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';
import { BeltAttestationService } from './belt-attestation.service';
import { BeltAttestationRequestDto } from './dto/belt-attestation-request.dto';
import { CurrentUser, Role } from '@auth/decorators';
import { JwtPayload } from '@auth/interfaces';
import { RoleGuard } from '@auth/guards/role.guard';
import { RoleEnum } from '@shared/enums/role.enum';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import {
    BeltAttestationAthleteResponseDto,
    BeltAttestationResponseDto,
    BeltAttestationWrapperResponseDto
} from './dto/belt-attestation-response.dto';
import { PaginationResponseDto } from '@shared/dto/pagination-response.dto';

@Controller('belt-attestation')
export class BeltAttestationController {
    constructor(
        private readonly beltAttestationService: BeltAttestationService
    ) {}

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER)
    @Post()
    @ApiOkResponse({ type: BeltAttestationWrapperResponseDto })
    async createRequest(
        @Body() dto: BeltAttestationRequestDto,
        @CurrentUser() user: JwtPayload
    ) {
        return this.beltAttestationService.createRequest(dto, user.id);
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER, RoleEnum.CHAIRMAN)
    @Get()
    @ApiExtraModels(PaginationResponseDto, BeltAttestationResponseDto)
    @ApiOkResponse({
        schema: {
            allOf: [
                {
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                $ref: getSchemaPath(BeltAttestationResponseDto)
                            }
                        }
                    }
                },
                { $ref: getSchemaPath(PaginationResponseDto) }
            ]
        }
    })
    async findAll(
        @Query() query: PaginationQueryDto,
        @CurrentUser() user: JwtPayload
    ) {
        return this.beltAttestationService.findAll(query, user);
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER, RoleEnum.CHAIRMAN)
    @Get(':id/athletes')
    @ApiExtraModels(PaginationResponseDto, BeltAttestationAthleteResponseDto)
    @ApiOkResponse({
        schema: {
            allOf: [
                {
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                $ref: getSchemaPath(
                                    BeltAttestationAthleteResponseDto
                                )
                            }
                        }
                    }
                },
                { $ref: getSchemaPath(PaginationResponseDto) }
            ]
        }
    })
    async findAthletes(
        @Param('id', ParseIntPipe) id: number,
        @Query() query: PaginationQueryDto,
        @CurrentUser() user: JwtPayload
    ) {
        return this.beltAttestationService.findAthletes(id, query, user);
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER, RoleEnum.CHAIRMAN)
    @Get(':id')
    @ApiOkResponse({ type: BeltAttestationWrapperResponseDto })
    async getById(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload
    ) {
        return this.beltAttestationService.getDtoById({
            id,
            requesterUser: user
        });
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.CHAIRMAN)
    @Patch(':id/accept')
    @ApiOkResponse({ type: BeltAttestationWrapperResponseDto })
    async accept(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload
    ) {
        return this.beltAttestationService.accept(id, user);
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER, RoleEnum.CHAIRMAN)
    @Patch(':id')
    @ApiOkResponse({ type: BeltAttestationWrapperResponseDto })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: BeltAttestationRequestDto,
        @CurrentUser() user: JwtPayload
    ) {
        return this.beltAttestationService.update(id, user, dto);
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER, RoleEnum.CHAIRMAN)
    @Delete(':id')
    @ApiOkResponse({ type: BeltAttestationWrapperResponseDto })
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload
    ) {
        return this.beltAttestationService.remove(id, user);
    }
}
