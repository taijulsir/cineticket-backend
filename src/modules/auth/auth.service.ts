import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtPayload } from './types/jwt-payload.type';

type AuthUser = { id: string; email: string; role: Role; passwordHash: string };
type SessionMeta = { device?: string; ipAddress?: string; userAgent?: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, session: SessionMeta) {
    const user = await this.validateUser(dto);
    await this.repo.createAuditLog({
      userId: user.id,
      action: 'AUTH_LOGIN_SUCCESS',
      resource: 'auth',
      metadata: { role: user.role, ipAddress: session.ipAddress, device: session.device },
    });
    return this.issueTokenPair({ sub: user.id, email: user.email, role: user.role }, session);
  }

  async refresh(dto: RefreshTokenDto, session: SessionMeta) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const record = await this.repo.findRefreshTokenById(payload.tokenId!);
    if (!record) {
      await this.handleTokenReuse(payload, 'NOT_FOUND', session);
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (record.userId !== payload.sub || record.role !== payload.role) {
      await this.handleTokenReuse(payload, 'IDENTITY_MISMATCH', session);
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (record.revokedAt || record.deletedAt || record.expiresAt < new Date()) {
      await this.handleTokenReuse(payload, 'REUSED_OR_EXPIRED', session);
      throw new UnauthorizedException('Session compromised. Please log in again.');
    }
    const matched = await bcrypt.compare(dto.refreshToken, record.tokenHash);
    if (!matched) {
      await this.handleTokenReuse(payload, 'HASH_MISMATCH', session);
      throw new UnauthorizedException('Session compromised. Please log in again.');
    }
    await this.repo.revokeRefreshToken(record.id);
    await this.repo.createAuditLog({
      userId: payload.sub,
      action: 'AUTH_REFRESH_ROTATE',
      resource: 'refresh_token',
      resourceId: record.id,
      metadata: { ipAddress: session.ipAddress, device: session.device },
    });
    return this.issueTokenPair({ sub: payload.sub, email: payload.email, role: payload.role }, session);
  }

  async logout(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    await this.repo.revokeRefreshToken(payload.tokenId!);
    await this.repo.createAuditLog({
      userId: payload.sub,
      action: 'AUTH_LOGOUT',
      resource: 'refresh_token',
      resourceId: payload.tokenId,
      metadata: { role: payload.role },
    });
    return { success: true };
  }

  private async validateUser(dto: LoginDto): Promise<AuthUser> {
    if (dto.role === Role.Customer) {
      const customer = await this.repo.findCustomerByEmail(dto.email);
      if (!customer) throw new UnauthorizedException('Invalid credentials');
      const passOk = await bcrypt.compare(dto.password, customer.passwordHash);
      if (!passOk) throw new UnauthorizedException('Invalid credentials');
      return { id: customer.id, email: customer.email, role: customer.role, passwordHash: customer.passwordHash };
    }
    const employee = await this.repo.findEmployeeByEmail(dto.email);
    if (!employee || employee.role !== dto.role) throw new UnauthorizedException('Invalid credentials');
    const passOk = await bcrypt.compare(dto.password, employee.passwordHash);
    if (!passOk) throw new UnauthorizedException('Invalid credentials');
    return { id: employee.id, email: employee.email, role: employee.role, passwordHash: employee.passwordHash };
  }

  private async issueTokenPair(base: Omit<JwtPayload, 'tokenId'>, session: SessionMeta) {
    const accessSecret =
      this.config.get<string>('JWT_SECRET') ?? this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessTtl = this.config.get<string>('ACCESS_TOKEN_EXPIRY') ?? '15m';
    const refreshTtl = this.config.get<string>('REFRESH_TOKEN_EXPIRY') ?? '30d';
    const accessTtlSeconds = this.parseExpiryToSeconds(accessTtl, 15 * 60);
    const refreshTtlSeconds = this.parseExpiryToSeconds(refreshTtl, 30 * 24 * 60 * 60);
    const refreshTtlMs = 30 * 24 * 60 * 60 * 1000;
    const refreshExpiry = new Date(Date.now() + refreshTtlMs);
    const refresh = await this.repo.createRefreshToken(base.sub, base.role, refreshExpiry, session);
    const refreshPayload: JwtPayload = { ...base, tokenId: refresh.id };
    const accessToken = await this.jwt.signAsync(base, {
      secret: accessSecret,
      expiresIn: accessTtlSeconds,
    });
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshTtlSeconds,
    });
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.repo.updateRefreshTokenHash(refresh.id, tokenHash);
    return { accessToken, refreshToken, expiresIn: '15m' };
  }

  private async handleTokenReuse(payload: JwtPayload, reason: string, session: SessionMeta) {
    await this.repo.revokeAllUserRefreshTokens(payload.sub);
    await this.repo.createAuditLog({
      userId: payload.sub,
      action: 'AUTH_REFRESH_TOKEN_REUSE_DETECTED',
      resource: 'refresh_token',
      resourceId: payload.tokenId,
      metadata: { reason, ipAddress: session.ipAddress, userAgent: session.userAgent },
    });
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (!payload.tokenId) throw new ForbiddenException('Invalid refresh token payload');
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private parseExpiryToSeconds(input: string, fallback: number): number {
    const match = /^([0-9]+)([smhd])$/.exec(input.trim());
    if (!match) return fallback;
    const value = Number(match[1]);
    const unit = match[2];
    if (unit === 's') return value;
    if (unit === 'm') return value * 60;
    if (unit === 'h') return value * 3600;
    if (unit === 'd') return value * 86400;
    return fallback;
  }
}
