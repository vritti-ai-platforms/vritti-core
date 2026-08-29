import type { CreatePaymentDto } from '@commerce/payments/dto/request/create-payment.dto';
import type { PaymentResponseDto } from '@commerce/payments/dto/response/payment-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class PaymentsGatewayService {
  private readonly logger = new Logger(PaymentsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Creates a payment against an invoice
  async create(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    this.logger.log(`payments.create — invoiceId: ${dto.invoiceId}, amount: ${dto.amount}`);
    return this.nats.send('commerce', 'site.payments.create', dto);
  }
}
