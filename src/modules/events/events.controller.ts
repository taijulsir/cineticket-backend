import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { QueryEventsDto } from './dto/query-events.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  @ApiOkResponse({ description: 'List events' })
  getAll(@Query() query: QueryEventsDto) {
    return this.service.getAll(query);
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Single event by slug with shows' })
  getBySlug(@Param('slug') slug: string) {
    return this.service.getBySlug(slug);
  }

  @Get(':slug/related')
  @ApiOkResponse({ description: 'Related events by slug' })
  getRelated(@Param('slug') slug: string) {
    return this.service.getRelated(slug);
  }
}
