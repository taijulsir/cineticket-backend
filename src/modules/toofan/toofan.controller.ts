import { Controller, Get } from '@nestjs/common';
import { ToofanService } from './toofan.service';

@Controller('toofan')
export class ToofanController {
  constructor(private readonly service: ToofanService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
