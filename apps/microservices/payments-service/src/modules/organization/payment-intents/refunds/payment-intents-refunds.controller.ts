import type { PaymentIntentDto } from '@domain/payment-intents/dto/entity/payment-intent.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { IntentWithEvents } from '../intent-with-events';
import { ListRefundPendingDto, RefundPaymentIntentDto } from './dto/request/refund-payment-intent.dto';
import { PaymentIntentsRefundsService } from './services/payment-intents-refunds.service';

// Refunds of paid intents. Reached only through core, which decides when to refund and holds the gateway's keys
@Controller()
export class PaymentIntentsRefundsController {
  private readonly logger = new Logger(PaymentIntentsRefundsController.name);

  constructor(private readonly service: PaymentIntentsRefundsService) {}

  @MessagePattern({ cmd: 'payments.intents.refund' })
  async refund(@Payload() dto: RefundPaymentIntentDto): Promise<{ providerRefundId: string; status: string }> {
    this.logger.log(`intents.refund — ${dto.paymentIntentId}`);
    return this.service.refund(dto);
  }

  // Asks the gateway where a pending refund stands and applies the answer, as its webhook would
  @MessagePattern({ cmd: 'payments.intents.syncRefund' })
  async syncRefund(@Payload() dto: RefundPaymentIntentDto): Promise<IntentWithEvents> {
    this.logger.log(`intents.syncRefund — ${dto.paymentIntentId}`);
    return this.service.syncRefund(dto);
  }

  @MessagePattern({ cmd: 'payments.intents.listRefundPending' })
  async listRefundPending(@Payload() dto: ListRefundPendingDto): Promise<PaymentIntentDto[]> {
    return this.service.listRefundPending(dto.limit ?? 100);
  }
}
