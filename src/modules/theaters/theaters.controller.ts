import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { QueryTheatersDto } from './dto/query-theaters.dto';
import { TheatersService } from './theaters.service';

@ApiTags('theaters')
@Controller('theaters')
export class TheatersController {
  constructor(private readonly service: TheatersService) {}

  @Get()
  @ApiOkResponse({ description: 'List theaters' })
  getAll(@Query() query: QueryTheatersDto) {
    return this.service.getAll(query);
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Detailed theater info' })
  getBySlug(@Param('slug') slug: string) {
    return this.service.getBySlug(slug);
  }

  @Get(':id/shows')
  @ApiOkResponse({ description: 'Current shows in this theater' })
  getShows(@Param('id') id: string) {
    return this.service.getShows(id);
  }

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
