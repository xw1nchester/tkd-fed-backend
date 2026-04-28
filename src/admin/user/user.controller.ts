import { Role } from '@auth/decorators';
import { RoleGuard } from '@auth/guards/role.guard';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginationResponseDto } from '@shared/dto/pagination-response.dto';
import { RoleEnum } from '@shared/enums/role.enum';
import { SearchQueryDto } from '@user/dto/search-query.dto';
import { UserResponseDto } from '@user/dto/user-response.dto';
import { UserService } from '@user/user.service';

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
        return await this.userService.findAll({ query, onlyWithoutRoles: false });
    }
}
