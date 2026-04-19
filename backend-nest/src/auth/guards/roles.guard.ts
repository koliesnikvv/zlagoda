import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EmployeeRole, ROLES_KEY } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<EmployeeRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      throw new ForbiddenException('Потрібна авторизація');
    }

    if (!requiredRoles.includes(user.role)) {
      if (requiredRoles.length === 1 && requiredRoles[0] === 'Manager') {
        throw new ForbiddenException('Доступ дозволено тільки менеджеру');
      }
      if (requiredRoles.length === 1 && requiredRoles[0] === 'Cashier') {
        throw new ForbiddenException('Доступ дозволено тільки касиру');
      }
      throw new ForbiddenException('Доступ заборонено');
    }

    return true;
  }
}
