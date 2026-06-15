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
    InvitedUserResponseDto,
    UserResponseDto,
    UserWrapperResponseDto
} from './dto/user-response.dto';
import { AvatarRequestDto } from './dto/avatar-request.dto';
import { BasicUserEditRequestDto } from './dto/basic-user-edit-request.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { PaginationResponseDto } from '@shared/dto/pagination-response.dto';
import { RoleGuard } from '@auth/guards/role.guard';
import { RoleEnum } from '@shared/enums/role.enum';
import { DetailedUserInfoRequestDto } from './dto/detailed-user-info-request.dto';
import { UserDetailedWrapperResponseDto } from './dto/user-detailed-response.dto';
import { InvitedUserQueryDto } from './dto/invited-user-query.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('me')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserWrapperResponseDto })
    async getUserMe(@CurrentUser() user: JwtPayload) {
        return await this.userService.getDtoById(user.id);
    }

    @Get('detailed')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserDetailedWrapperResponseDto })
    async getDetailedUserInfoDto(@CurrentUser() user: JwtPayload) {
        return await this.userService.getDetailedUserInfoDto(user.id);
    }

    @Patch('detailed')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserDetailedWrapperResponseDto })
    async updateDetailedUserInfo(
        @CurrentUser() user: JwtPayload,
        @Body() dto: DetailedUserInfoRequestDto
    ) {
        return await this.userService.updateDetailedUserInfo(user.id, dto);
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
        return await this.userService.updateAvatar(user.id, dto.fileId);
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
    async findAll(@Query() query: UserQueryDto) {
        return await this.userService.findAll({ query });
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER)
    @Get('me/invited-users')
    @ApiBearerAuth()
    @ApiExtraModels(PaginationResponseDto, InvitedUserResponseDto)
    @ApiOkResponse({
        schema: {
            allOf: [
                {
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                $ref: getSchemaPath(InvitedUserResponseDto)
                            }
                        }
                    }
                },
                { $ref: getSchemaPath(PaginationResponseDto) }
            ]
        }
    })
    async findInvitedUsers(
        @Query() query: InvitedUserQueryDto,
        @CurrentUser() user: JwtPayload
    ) {
        return await this.userService.findAll({
            query,
            invitedById: user.id,
            includeTeams: true
        });
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER)
    @Get(':id/detailed')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserDetailedWrapperResponseDto })
    async getDetailedUserInfoByTrainer(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload
    ) {
        return await this.userService.getDetailedUserInfoByTrainer(id, user.id);
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER)
    @Patch(':id/detailed')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserDetailedWrapperResponseDto })
    async updateDetailedUserInfoByTrainer(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload,
        @Body() dto: DetailedUserInfoRequestDto
    ) {
        return await this.userService.updateDetailedUserInfoByTrainer(
            id,
            user.id,
            dto
        );
    }
}
