import { Injectable } from '@nestjs/common';
import { EmployeeRole, EmployeeStatus, InviteStatus } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class EmployeesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    return this.db.employee.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        employeeRole: true,
        status: true,
        permissions: true,
        createdAt: true,
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.db.employee.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        employeeRole: true,
        status: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findByEmail(email: string) {
    return this.db.employee.findUnique({
      where: { email },
    });
  }

  async updateRole(id: string, role: EmployeeRole, permissions: string[]) {
    return this.db.employee.update({
      where: { id },
      data: {
        employeeRole: role,
        permissions,
      },
    });
  }

  async updateStatus(id: string, status: EmployeeStatus) {
    return this.db.employee.update({
      where: { id },
      data: { status },
    });
  }

  async softDelete(id: string) {
    return this.db.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createInvite(email: string, role: EmployeeRole, token: string, invitedById: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    return this.db.employeeInvite.create({
      data: {
        email,
        role,
        token,
        expiresAt,
        invitedById,
      },
    });
  }

  async findInviteByToken(token: string) {
    return this.db.employeeInvite.findUnique({
      where: { token },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async updateInviteStatus(id: string, status: InviteStatus) {
    return this.db.employeeInvite.update({
      where: { id },
      data: { status },
    });
  }

  async createEmployeeFromInvite(
    email: string,
    name: string,
    passwordHash: string,
    role: EmployeeRole,
    permissions: string[],
    invitedById: string,
  ) {
    return this.db.employee.create({
      data: {
        email,
        name,
        passwordHash,
        employeeRole: role,
        role: 'Employee', // For backward compatibility
        permissions,
        status: EmployeeStatus.ACTIVE,
        isEmployee: true,
        invitedById,
      },
    });
  }
}
