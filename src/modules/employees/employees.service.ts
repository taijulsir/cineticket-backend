import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeRole, EmployeeStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { ROLE_PERMISSIONS } from 'src/common/constants/permissions';
import { EmployeesRepository } from './employees.repository';
import { InviteEmployeeDto } from './dto/invite-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly repository: EmployeesRepository) {}

  healthCheck() {
    return { module: 'employees', status: 'ok' };
  }

  async getAllEmployees() {
    return this.repository.findAll();
  }

  async getEmployeeById(id: string) {
    const employee = await this.repository.findById(id);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async inviteEmployee(dto: InviteEmployeeDto, invitedById: string) {
    // Check if employee already exists
    const existingEmployee = await this.repository.findByEmail(dto.email);
    if (existingEmployee && !existingEmployee.deletedAt) {
      throw new BadRequestException('Employee with this email already exists');
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');

    // Create invitation
    const invite = await this.repository.createInvite(
      dto.email,
      dto.role,
      token,
      invitedById,
    );

    // TODO: Send email with invitation link
    // const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;
    // await this.emailService.sendInvitation(dto.email, dto.name, inviteLink);

    return {
      message: 'Invitation sent successfully',
      inviteToken: token, // Remove this in production, only for testing
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    };
  }

  async updateEmployeeRole(id: string, role: EmployeeRole) {
    const employee = await this.getEmployeeById(id);

    // Get default permissions for the role
    const permissions = ROLE_PERMISSIONS[role];

    await this.repository.updateRole(id, role, permissions);

    return {
      message: 'Employee role updated successfully',
    };
  }

  async updateEmployeeStatus(id: string, status: EmployeeStatus) {
    await this.getEmployeeById(id);

    await this.repository.updateStatus(id, status);

    return {
      message: 'Employee status updated successfully',
    };
  }

  async deleteEmployee(id: string) {
    await this.getEmployeeById(id);

    await this.repository.softDelete(id);

    return {
      message: 'Employee deleted successfully',
    };
  }
}
