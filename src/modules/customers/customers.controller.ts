import { Controller, Get } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
