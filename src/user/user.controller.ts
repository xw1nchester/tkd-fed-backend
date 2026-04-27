import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Query
} from '@nestjs/common';

import { UserService } from './user.service';
import { CurrentUser } from '@auth/decorators';
import { JwtPayload } from '@auth/interfaces';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { UserResponseDto, UserWrapperResponseDto } from './dto/user-response.dto';
import { AvatarRequestDto } from './dto/avatar-request.dto';
import { BasicProfileRequestDto } from './dto/basic-profile-request.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { PaginationResponseDto } from '@shared/dto/pagination-response.dto';

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

    @Patch()
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserWrapperResponseDto })
    async updateBasicProfileInfo(
        @CurrentUser() user: JwtPayload,
        @Body() dto: BasicProfileRequestDto
    ) {
        return await this.userService.updateBasicProfileInfo(user.id, dto);
    }

    @Get()
    @ApiExtraModels(PaginationResponseDto, UserResponseDto)
    @ApiOkResponse({
        schema: {
            allOf: [
                {
                    properties: {
                        data: {
                            type: 'array',
                            items: { $ref: getSchemaPath(UserResponseDto) }
                        }
                    }
                },
                { $ref: getSchemaPath(PaginationResponseDto) }
            ]
        }
    })
    async findAll(@Query() query: SearchQueryDto) {
        return await this.userService.findAll(query);
    }
}
