import { Observable } from 'rxjs';

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLE_KEY } from '@auth/decorators';
import { JwtPayload } from '@auth/interfaces';
import { RoleEnum } from '@shared/enums/role.enum';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(
        ctx: ExecutionContext
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as JwtPayload;
        const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(
            ROLE_KEY,
            [ctx.getHandler(), ctx.getClass()]
        );

        if (!requiredRoles?.length) {
            return true;
        }

        return requiredRoles.some(role => user.roles.includes(role));
    }
}
