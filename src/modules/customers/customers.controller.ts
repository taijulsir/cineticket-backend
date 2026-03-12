import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CustomersService } from './customers.service';

@ApiTags('customer')
@Controller('customer')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Customer)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Authenticated customer profile with recent booking history' })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.service.getProfile(user.sub);
  }
}
