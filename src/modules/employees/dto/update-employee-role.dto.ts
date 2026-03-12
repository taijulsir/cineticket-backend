import { EmployeeRole } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateEmployeeRoleDto {
  @IsEnum(EmployeeRole)
  @IsNotEmpty()
  role: EmployeeRole;
}
