import { Role } from '@auth/decorators';
import { RoleGuard } from '@auth/guards/role.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RolesResponseDto } from '@role/dto/role-response.dto';
import { RoleService } from '@role/role.service';
import { RoleEnum } from '@shared/enums/role.enum';

@ApiTags('Admin')
@UseGuards(RoleGuard)
@Role(RoleEnum.ADMIN)
@Controller('admin/role')
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @Get()
    @ApiOkResponse({ type: RolesResponseDto })
    findAll() {
        return this.roleService.findAll();
    }
}
