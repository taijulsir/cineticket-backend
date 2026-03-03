import { Controller, Get } from '@nestjs/common';
import { TheatersService } from './theaters.service';

@Controller('theaters')
export class TheatersController {
  constructor(private readonly service: TheatersService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
