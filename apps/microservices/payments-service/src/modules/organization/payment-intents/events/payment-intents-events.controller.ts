import type { PaymentEventDto } from '@domain/payment-events/dto/entity/payment-event.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AckPaymentEventsDto, PendingPaymentEventsDto } from './dto/request/payment-event-requests.dto';
import { PaymentIntentsEventsService } from './services/payment-intents-events.service';

// The outbox, as core drains it: its sweep reads what it has not acknowledged and acknowledges what it dispatched
@Controller()
export class PaymentIntentsEventsController {
  constructor(private readonly service: PaymentIntentsEventsService) {}

  @MessagePattern({ cmd: 'payments.events.pending' })
  async pending(@Payload() dto: PendingPaymentEventsDto): Promise<{ events: PaymentEventDto[] }> {
    return { events: await this.service.pending(dto.limit ?? 100) };
  }

  @MessagePattern({ cmd: 'payments.events.ack' })
  async ack(@Payload() dto: AckPaymentEventsDto): Promise<{ acked: number }> {
    return { acked: await this.service.ack(dto.ids) };
  }
}
