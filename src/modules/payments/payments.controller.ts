import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { FailPaymentDto } from './dto/fail-payment.dto';
import { StartPaymentDto } from './dto/start-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }

  @Post('mock/start')
  @ApiBody({ type: StartPaymentDto })
  @ApiOkResponse({ description: 'Create mock payment session for pending order' })
  start(@Body() dto: StartPaymentDto) {
    return this.service.startPayment(dto);
  }

  @Post('stripe/start')
  @ApiBody({ type: StartPaymentDto })
  @ApiOkResponse({ description: 'Create Stripe checkout session for pending order' })
  startStripe(@Body() dto: StartPaymentDto) {
    return this.service.startStripePayment(dto);
  }

  @Post('mock/confirm')
  @ApiBody({ type: ConfirmPaymentDto })
  @ApiOkResponse({ description: 'Confirm payment and mark order confirmed' })
  confirm(@Body() dto: ConfirmPaymentDto) {
    return this.service.confirmPayment(dto);
  }

  @Post('stripe/confirm')
  @ApiBody({ type: ConfirmPaymentDto })
  @ApiOkResponse({ description: 'Confirm Stripe checkout session and mark order confirmed' })
  confirmStripe(@Body() dto: ConfirmPaymentDto) {
    return this.service.confirmStripePayment(dto);
  }

  @Post('mock/fail')
  @ApiBody({ type: FailPaymentDto })
  @ApiOkResponse({ description: 'Mark pending order expired and release seats' })
  fail(@Body() dto: FailPaymentDto) {
    return this.service.failPayment(dto);
  }
}
