import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EmployeeRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/common/constants/permissions';
import { EmployeesService } from './employees.service';
import { InviteEmployeeDto } from './dto/invite-employee.dto';
import { UpdateEmployeeRoleDto } from './dto/update-employee-role.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }

  @Get()
  @RequirePermissions(PERMISSIONS.EMPLOYEES_VIEW)
  getAllEmployees() {
    return this.service.getAllEmployees();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_VIEW)
  getEmployeeById(@Param('id') id: string) {
    return this.service.getEmployeeById(id);
  }

  @Post('invite')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_INVITE)
  inviteEmployee(
    @Body() dto: InviteEmployeeDto,
    @CurrentUser('id') invitedById: string,
  ) {
    return this.service.inviteEmployee(dto, invitedById);
  }

  @Patch(':id/role')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_UPDATE)
  updateEmployeeRole(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeRoleDto,
  ) {
    return this.service.updateEmployeeRole(id, dto.role);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_UPDATE)
  updateEmployeeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeStatusDto,
  ) {
    return this.service.updateEmployeeStatus(id, dto.status);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_DELETE)
  deleteEmployee(@Param('id') id: string) {
    return this.service.deleteEmployee(id);
  }
}
