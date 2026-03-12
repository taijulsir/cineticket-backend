import { Role, EmployeeRole } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
  employeeRole?: EmployeeRole;
  permissions?: string[];
  tokenId?: string;
};
