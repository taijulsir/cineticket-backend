import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EmployeeRole } from '@prisma/client';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{ 
      user?: { 
        permissions?: string[];
        employeeRole?: EmployeeRole;
      } 
    }>();

    if (!req.user) {
      return false;
    }

    // Super admins have all permissions
    if (req.user.employeeRole === EmployeeRole.SUPER_ADMIN) {
      return true;
    }

    const userPermissions = req.user.permissions || [];

    // Check if user has all required permissions
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }
}
