import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthService } from './auth.service';
import { JwtPayload } from './types/jwt-payload.type';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Access and refresh token pair' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, this.getSessionMeta(req));
  }

  @Post('refresh')
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ description: 'Rotated access and refresh token pair' })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refresh(dto, this.getSessionMeta(req));
  }

  @Post('logout')
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ schema: { type: 'object', properties: { success: { type: 'boolean' } } } })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  profile(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('admin-example')
  @ApiBearerAuth()
  adminExample() {
    return { ok: true, route: 'admin-only' };
  }

  private getSessionMeta(req: Request) {
    const device = String(req.headers['x-device-id'] ?? 'web');
    const userAgent = String(req.headers['user-agent'] ?? 'unknown');
    return { device, userAgent, ipAddress: req.ip };
  }
}
