import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Query,
    UseGuards
} from '@nestjs/common';

import { UserService } from './user.service';
import { CurrentUser, Public, Role } from '@auth/decorators';
import { JwtPayload } from '@auth/interfaces';
import {
    ApiBearerAuth,
    ApiExtraModels,
    ApiOkResponse,
    getSchemaPath
} from '@nestjs/swagger';
import {
    UserResponseDto,
    UserWrapperResponseDto
} from './dto/user-response.dto';
import { AvatarRequestDto } from './dto/avatar-request.dto';
import { BasicUserEditRequestDto } from './dto/basic-user-edit-request.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { PaginationResponseDto } from '@shared/dto/pagination-response.dto';
import { RoleGuard } from '@auth/guards/role.guard';
import { RoleEnum } from '@shared/enums/role.enum';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('me')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserWrapperResponseDto })
    async getUserMe(@CurrentUser() user: JwtPayload) {
        return await this.userService.getDtoById(user.id);
    }

    @Public()
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
        @Body() dto: BasicUserEditRequestDto
    ) {
        return await this.userService.updateBasicUserInfo(user.id, dto);
    }

    @Public()
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
        return await this.userService.findAll({ query });
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER)
    @Get('me/invited-users')
    @ApiBearerAuth()
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
    async findInvitedUsers(
        @Query() query: SearchQueryDto,
        @CurrentUser() user: JwtPayload
    ) {
        return await this.userService.findAll({ query, invitedById: user.id });
    }
}
