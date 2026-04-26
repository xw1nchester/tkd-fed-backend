import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { UserService } from './user.service';
import { CurrentUser } from '@auth/decorators';
import { JwtPayload } from '@auth/interfaces';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { UserWrapperResponseDto } from './dto/user-response.dto';

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
}
