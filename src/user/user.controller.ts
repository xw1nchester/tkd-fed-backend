import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';

import { UserService } from './user.service';
import { CurrentUser } from '@auth/decorators';
import { JwtPayload } from '@auth/interfaces';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { UserWrapperResponseDto } from './dto/user-response.dto';
import { AvatarRequestDto } from './dto/avatar-request.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('me')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserWrapperResponseDto })
    async getUserMe(@CurrentUser() user: JwtPayload) {
        return await this.userService.getDtoById(user.id);
    }

    @Get(':id')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserWrapperResponseDto })
    async getUserById(@Param('id', ParseIntPipe) id: number) {
        return await this.userService.getDtoById(id);
    }

    @Patch('avatar')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserWrapperResponseDto })
    async updateAvatar(
        @CurrentUser() user: JwtPayload,
        @Body() dto: AvatarRequestDto
    ) {
        return await this.userService.updateAvatar(user.id, dto.key);
    }

    @Delete('avatar')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserWrapperResponseDto })
    async deleteAvatar(@CurrentUser() user: JwtPayload) {
        return await this.userService.deleteAvatar(user.id);
    }
}
