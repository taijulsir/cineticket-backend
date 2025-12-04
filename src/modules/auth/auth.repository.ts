import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';

type SessionMeta = {
  device?: string;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEmployeeByEmail(email: string) {
    return this.prisma.employee.findFirst({ where: { email, deletedAt: null } });
  }

  findCustomerByEmail(email: string) {
    return this.prisma.customer.findFirst({ where: { email, deletedAt: null } });
  }

  createRefreshToken(userId: string, role: Role, expiresAt: Date, session: SessionMeta) {
    return this.prisma.refreshToken.create({
      data: { userId, role, expiresAt, tokenHash: '', ...session },
    });
  }

  updateRefreshTokenHash(id: string, tokenHash: string) {
    return this.prisma.refreshToken.update({ where: { id }, data: { tokenHash } });
  }

  findActiveRefreshToken(id: string, userId: string, role: Role) {
    return this.prisma.refreshToken.findFirst({ where: { id, userId, role, revokedAt: null, deletedAt: null } });
  }

  findRefreshTokenById(id: string) {
    return this.prisma.refreshToken.findUnique({ where: { id } });
  }

  revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  revokeAllUserRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null, deletedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  createAuditLog(input: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        metadata: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
  }
}
