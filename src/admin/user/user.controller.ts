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
import { SearchQueryDto } from '@user/dto/search-query.dto';
import {
    UserResponseDto,
    UserWrapperResponseDto
} from '@user/dto/user-response.dto';
import { UserService } from '@user/user.service';
import { UserEditRequestDto } from './dto/user-edit-request.dto';
import { AvatarRequestDto } from '@user/dto/avatar-request.dto';
import { JwtPayload } from '@auth/interfaces';

@ApiTags('Admin')
@UseGuards(RoleGuard)
@Role(RoleEnum.ADMIN)
@Controller('admin/user')
export class UserController {
    constructor(private readonly userService: UserService) {}

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
        return await this.userService.findAll({
            query,
            onlyWithoutRoles: false
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
    async deleteUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
        return await this.userService.deleteUser(id, user.id);
    }

    @Patch(':id/avatar')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserWrapperResponseDto })
    async updateAvatar(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AvatarRequestDto
    ) {
        return await this.userService.updateAvatar(id, dto.key);
    }

    @Delete(':id/avatar')
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserWrapperResponseDto })
    async deleteAvatar(@Param('id', ParseIntPipe) id: number) {
        return await this.userService.deleteAvatar(id);
    }
}
