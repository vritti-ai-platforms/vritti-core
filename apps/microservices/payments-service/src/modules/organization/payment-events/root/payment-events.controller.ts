import { PaymentEventDto } from '@domain/payment-events/dto/entity/payment-event.dto';
import { PaymentEventsDomainRepository } from '@domain/payment-events/repositories/payment-events.repository';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AckPaymentEventsDto,
  PendingPaymentEventsDto,
} from '@/modules/payment-lifecycle/dto/payment-intent-requests.dto';

// The outbox, as core drains it: every state change is also returned to core in the response that caused it, so
// this is the safety net — core's sweep reads what it has not acknowledged and acknowledges what it dispatched
@Controller()
export class PaymentEventsController {
  private readonly logger = new Logger(PaymentEventsController.name);

  constructor(private readonly events: PaymentEventsDomainRepository) {}

  @MessagePattern({ cmd: 'payments.events.pending' })
  async pending(@Payload() dto: PendingPaymentEventsDto): Promise<{ events: PaymentEventDto[] }> {
    const rows = await this.events.findPending(dto.limit ?? 100);
    return { events: rows.map((row) => PaymentEventDto.from(row)) };
  }

  @MessagePattern({ cmd: 'payments.events.ack' })
  async ack(@Payload() dto: AckPaymentEventsDto): Promise<{ acked: number }> {
    const acked = await this.events.ack(dto.ids, new Date());
    this.logger.log(`events.ack — ${acked}/${dto.ids.length}`);
    return { acked };
  }
}
