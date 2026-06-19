import { CurrentUser, Role } from '@auth/decorators';
import { RoleGuard } from '@auth/guards/role.guard';
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
import {
    ApiBearerAuth,
    ApiExtraModels,
    ApiOkResponse,
    ApiTags,
    getSchemaPath
} from '@nestjs/swagger';
import { PaginationResponseDto } from '@shared/dto/pagination-response.dto';
import { RoleEnum } from '@shared/enums/role.enum';
import {
    UserResponseDto,
    UserWrapperResponseDto
} from '@user/dto/user-response.dto';
import { UserService } from '@user/services/user.service';
import { UserEditRequestDto } from '../dto/user-edit-request.dto';
import { AvatarRequestDto } from '@user/dto/avatar-request.dto';
import { JwtPayload } from '@auth/interfaces';
import { AdminUserQueryDto } from '../dto/admin-user-query.dto';
import { AdminDetailedUserInfoRequestDto } from '../dto/admin-detailed-user-info-request.dto';
import { UserDetailedWrapperResponseDto } from '@user/dto/user-detailed-response.dto';
import { RatingService } from '@user/services/rating.service';

@ApiTags('Admin')
@UseGuards(RoleGuard)
@Role(RoleEnum.ADMIN)
@Controller('admin/user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly ratingService: RatingService
    ) {}

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
    async findAll(@Query() query: AdminUserQueryDto) {
        return await this.userService.findAll({
            query,
            excludeAdmins: false
        });
    }

    @Patch(':id')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserWrapperResponseDto })
    async updateBasicProfileInfo(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UserEditRequestDto
    ) {
        return await this.userService.updateUserInfo(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserWrapperResponseDto })
    async removeUser(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload
    ) {
        return await this.userService.removeUser(id, user.id);
    }

    @Patch(':id/avatar')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserWrapperResponseDto })
    async updateAvatar(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AvatarRequestDto
    ) {
        return await this.userService.updateAvatar(id, dto.fileId);
    }

    @Delete(':id/avatar')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserWrapperResponseDto })
    async deleteAvatar(@Param('id', ParseIntPipe) id: number) {
        return await this.userService.deleteAvatar(id);
    }

    @Get(':id/detailed')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserDetailedWrapperResponseDto })
    async getDetailedUserInfoDto(@Param('id', ParseIntPipe) id: number) {
        return await this.userService.getDetailedUserInfoDto(id);
    }

    @Patch(':id/detailed')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserDetailedWrapperResponseDto })
    async updateDetailedUserInfo(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AdminDetailedUserInfoRequestDto
    ) {
        return await this.userService.updateDetailedUserInfo(id, dto);
    }
}
