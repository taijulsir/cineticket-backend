import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { QueryShowsDto } from './dto/query-shows.dto';
import { ShowsService } from './shows.service';

@ApiTags('shows', 'seats')
@Controller('shows')
export class ShowsController {
  constructor(private readonly service: ShowsService) {}

  @Get()
  @ApiOkResponse({ description: 'List shows' })
  getAll(@Query() query: QueryShowsDto) {
    return this.service.getAll(query);
  }

  @Get(':id/seats')
  @ApiParam({ name: 'id', description: 'Show ID' })
  @ApiOkResponse({ description: 'Seat layout with merged show status' })
  getSeats(@Param('id') showId: string) {
    return this.service.getSeats(showId);
  }

  @Get(':id/seat-map')
  @ApiParam({ name: 'id', description: 'Show ID' })
  @ApiOkResponse({ description: 'Seat map grouped by rows' })
  getSeatMap(@Param('id') showId: string) {
    return this.service.getSeatMap(showId);
  }
}
