import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
@UseGuards(ThrottlerGuard)
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiBody({ type: CreateOrderDto })
  @ApiOkResponse({ description: 'Create order and book seats transactionally' })
  create(@Body() dto: CreateOrderDto) {
    return this.service.create(dto);
  }

  @Get(':orderId')
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @ApiOkResponse({ description: 'Single order with items' })
  findOne(@Param('orderId') orderId: string) {
    return this.service.findOne(orderId);
  }

  @Get()
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOkResponse({ description: 'Paginated orders' })
  list(@Query() query: OrderQueryDto) {
    return this.service.list(query);
  }
}
