import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InviteStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { ROLE_PERMISSIONS } from 'src/common/constants/permissions';
import { EmployeesRepository } from '../employees/employees.repository';
import { AuthRepository } from './auth.repository';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtPayload } from './types/jwt-payload.type';

type AuthUser = { id: string; email: string; role: Role; passwordHash: string };
type SessionMeta = { device?: string; ipAddress?: string; userAgent?: string };

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly repo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly employeesRepo: EmployeesRepository,
  ) {
    this.googleClient = new OAuth2Client(
      this.config.get<string>('GOOGLE_CLIENT_ID'),
      this.config.get<string>('GOOGLE_CLIENT_SECRET'),
      this.config.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

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

  async signup(dto: SignupDto, session: SessionMeta) {
    const existing = await this.repo.findCustomerByEmail(dto.email);
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const customer = await this.repo.createCustomer({
      name: dto.name,
      email: dto.email,
      passwordHash,
      mobile: dto.mobile,
      isSocial: false,
      isVerified: false,
    });

    await this.repo.createAuditLog({
      userId: customer.id,
      action: 'AUTH_SIGNUP',
      resource: 'customer',
      resourceId: customer.id,
      metadata: { ipAddress: session.ipAddress, device: session.device },
    });

    return this.issueTokenPair(
      { sub: customer.id, email: customer.email, role: customer.role },
      session,
    );
  }

  async googleLogin(dto: GoogleLoginDto, session: SessionMeta) {
    const googleClientId = this.config.get<string>('GOOGLE_CLIENT_ID');

    let googlePayload: { sub?: string; email?: string; name?: string; picture?: string };

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.googleToken,
        audience: googleClientId,
      });

      const p = ticket.getPayload();
      if (!p) throw new Error('Empty payload');

      googlePayload = {
        sub: p.sub,
        email: p.email,
        name: p.name,
        picture: p.picture,
      };
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!googlePayload.email || !googlePayload.sub) {
      throw new UnauthorizedException('Google token did not return an email or user ID');
    }

    let customer = await this.repo.findCustomerByGoogleId(googlePayload.sub);

    if (!customer) {
      customer = await this.repo.findCustomerByEmail(googlePayload.email);

      if (customer) {
        customer = await this.repo.updateCustomerGoogleId(
          customer.id,
          googlePayload.sub,
          googlePayload.picture,
        );
      }
    }

    if (!customer) {
      customer = await this.repo.createCustomer({
        name: googlePayload.name ?? googlePayload.email.split('@')[0],
        email: googlePayload.email,
        passwordHash: await bcrypt.hash(googlePayload.sub + Date.now(), 12),
        googleId: googlePayload.sub,
        dp: googlePayload.picture,
        isSocial: true,
        isVerified: true,
      });
    }

    await this.repo.createAuditLog({
      userId: customer.id,
      action: 'AUTH_GOOGLE_LOGIN',
      resource: 'customer',
      resourceId: customer.id,
      metadata: { ipAddress: session.ipAddress, device: session.device },
    });

    return this.issueTokenPair(
      { sub: customer.id, email: customer.email, role: customer.role },
      session,
    );
  }

  async acceptInvite(dto: AcceptInviteDto, session: SessionMeta) {
    const invite = await this.employeesRepo.findInviteByToken(dto.token);

    if (!invite) {
      throw new UnauthorizedException('Invalid invitation token');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new UnauthorizedException('Invitation has already been used or expired');
    }

    if (invite.expiresAt < new Date()) {
      await this.employeesRepo.updateInviteStatus(invite.id, InviteStatus.EXPIRED);
      throw new UnauthorizedException('Invitation has expired');
    }

    const existingEmployee = await this.employeesRepo.findByEmail(invite.email);

    if (existingEmployee && !existingEmployee.deletedAt) {
      throw new ConflictException('Employee account already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const roleKey = invite.role as keyof typeof ROLE_PERMISSIONS;
    const permissions = ROLE_PERMISSIONS[roleKey];

    const employee = await this.employeesRepo.createEmployeeFromInvite(
      invite.email,
      dto.name,
      passwordHash,
      invite.role,
      permissions,
      invite.invitedById,
    );

    await this.employeesRepo.updateInviteStatus(invite.id, InviteStatus.ACCEPTED);

    await this.repo.createAuditLog({
      userId: employee.id,
      action: 'AUTH_EMPLOYEE_INVITE_ACCEPTED',
      resource: 'employee',
      resourceId: employee.id,
      metadata: { role: invite.role, invitedBy: invite.invitedById, ipAddress: session.ipAddress },
    });

    return this.issueTokenPair(
      { sub: employee.id, email: employee.email, role: employee.role },
      session,
    );
  }

  private async validateUser(dto: LoginDto): Promise<AuthUser> {
    if (dto.role === Role.Customer) {
      const customer = await this.repo.findCustomerByEmail(dto.email);

      if (!customer || !customer.passwordHash) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const passOk = await bcrypt.compare(dto.password, customer.passwordHash);

      if (!passOk) throw new UnauthorizedException('Invalid credentials');

      return {
        id: customer.id,
        email: customer.email,
        role: customer.role,
        passwordHash: customer.passwordHash,
      };
    }

    const employee = await this.repo.findEmployeeByEmail(dto.email);

    if (!employee || employee.role !== dto.role || !employee.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passOk = await bcrypt.compare(dto.password, employee.passwordHash);

    if (!passOk) throw new UnauthorizedException('Invalid credentials');

    return {
      id: employee.id,
      email: employee.email,
      role: employee.role,
      passwordHash: employee.passwordHash,
    };
  }

  private async issueTokenPair(base: Omit<JwtPayload, 'tokenId'>, session: SessionMeta) {
    const accessSecret =
      this.config.get<string>('JWT_SECRET') ?? this.config.getOrThrow<string>('JWT_ACCESS_SECRET');

    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');

    const accessToken = await this.jwt.signAsync(base, {
      secret: accessSecret,
      expiresIn: '15m',
    });

    const refresh = await this.repo.createRefreshToken(
      base.sub,
      base.role,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      session,
    );

    const refreshPayload: JwtPayload = { ...base, tokenId: refresh.id };

    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: refreshSecret,
      expiresIn: '30d',
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

      if (!payload.tokenId) {
        throw new ForbiddenException('Invalid refresh token payload');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}