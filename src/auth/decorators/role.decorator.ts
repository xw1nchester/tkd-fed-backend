import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from '@shared/enums/role.enum';

export const ROLE_KEY = 'roles';

export const Role = (...roles: RoleEnum[]) => SetMetadata(ROLE_KEY, roles);
