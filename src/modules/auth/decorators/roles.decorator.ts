import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const AUTH_ROLES_KEY = 'auth_roles';
export const Roles = (...roles: Role[]) => SetMetadata(AUTH_ROLES_KEY, roles);
