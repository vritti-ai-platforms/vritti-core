import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { CreatePaymentDto } from './dto/request/create-payment.dto';
import type { PaymentResponseDto } from './dto/response/payment-response.dto';
import { PaymentsGatewayService } from './services/payments-gateway.service';

@ApiTags('Commerce - Payments')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@Controller('payments')
export class PaymentsGatewayController {
  constructor(private readonly paymentsGatewayService: PaymentsGatewayService) {}

  // Creates a payment against an invoice
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    return this.paymentsGatewayService.create(dto);
  }
}
