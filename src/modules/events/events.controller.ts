import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload.type';
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

  @Get('customerUpvoteEvent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Events upvoted by the customer' })
  getCustomerUpvotes(@CurrentUser() user: JwtPayload) {
    return this.service.getCustomerUpvotes(user.sub);
  }

  @Get('upcoming')
  @ApiOkResponse({ description: 'Upcoming events' })
  getUpcoming(@Query() query: QueryEventsDto) {
    return this.service.getAll({ ...query, status: 'UPCOMING' });
  }
}
