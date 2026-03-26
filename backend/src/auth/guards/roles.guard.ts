import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleCode } from '../../entities/role.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleCode[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest<{ user: { roles: { code: RoleCode }[] } }>();
    if (!user?.roles) throw new ForbiddenException('无权限');

    const hasRole = requiredRoles.some((role) =>
      user.roles.some((r) => r.code === role),
    );
    if (!hasRole) throw new ForbiddenException('无权限');
    return true;
  }
}
