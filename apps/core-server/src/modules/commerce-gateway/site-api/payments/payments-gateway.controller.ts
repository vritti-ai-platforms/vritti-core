import { CreatePaymentDto } from '@commerce/payments/dto/request/create-payment.dto';
import type { PaymentResponseDto } from '@commerce/payments/dto/response/payment-response.dto';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { PaymentsGatewayService } from './services/payments-gateway.service';

@ApiTags('Commerce - Payments')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
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
