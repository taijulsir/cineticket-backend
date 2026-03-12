import { EmployeeStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateEmployeeStatusDto {
  @IsEnum(EmployeeStatus)
  @IsNotEmpty()
  status!: EmployeeStatus;
}
