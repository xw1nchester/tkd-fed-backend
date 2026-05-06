import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    UseGuards
} from '@nestjs/common';
import { InviteTokenService } from './invite-token.service';
import { RoleGuard } from '@auth/guards/role.guard';
import { CurrentUser, Public, Role } from '@auth/decorators';
import { RoleEnum } from '@shared/enums/role.enum';
import { InviteTokenRequestDto } from './dto/token-request.dto';
import { JwtPayload } from '@auth/interfaces';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { InviteTokensWrapperResponseDto, InviteTokenWrapperResponseDto } from './dto/token-response.dto';

@Controller('invite-token')
export class InviteTokenController {
    constructor(private readonly inviteTokenService: InviteTokenService) {}

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER)
    @Post()
    @ApiBearerAuth()
    @ApiOkResponse({ type: InviteTokenWrapperResponseDto })
    async create(
        @Body() dto: InviteTokenRequestDto,
        @CurrentUser() user: JwtPayload
    ) {
        return await this.inviteTokenService.create(dto, user.id);
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER)
    @Get()
    @ApiBearerAuth()
    @ApiOkResponse({ type: InviteTokensWrapperResponseDto })
    async findAllByCreatorId(@CurrentUser() user: JwtPayload) {
        return await this.inviteTokenService.findAllByCreatorId(user.id);
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    async deleteByIdAndCreatorId(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload
    ) {
        return await this.inviteTokenService.deleteByIdAndCreatorId(
            id,
            user.id
        );
    }

    @Public()
    @Get(':id')
    @ApiOkResponse({ type: InviteTokenWrapperResponseDto })
    async getDtoById(@Param('id', ParseIntPipe) id: number) {
        return await this.inviteTokenService.getDtoById(id);
    }
}
