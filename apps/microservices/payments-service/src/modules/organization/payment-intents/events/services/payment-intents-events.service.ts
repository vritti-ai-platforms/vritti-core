import { PaymentEventDto } from '@domain/payment-events/dto/entity/payment-event.dto';
import { PaymentEventsDomainRepository } from '@domain/payment-events/repositories/payment-events.repository';
import { Injectable, Logger } from '@nestjs/common';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { PaymentEventType, PaymentIntent } from '@/db/schema';

// The outbox of what happened to intents. The root and refunds services write to it as they change an intent; core
// drains it — every state change is also returned to core in the response that caused it, so reading what is pending
// is the safety net: core's sweep reads what it has not acknowledged and acknowledges what it dispatched
@Injectable()
export class PaymentIntentsEventsService {
  private readonly logger = new Logger(PaymentIntentsEventsService.name);

  constructor(private readonly events: PaymentEventsDomainRepository) {}

  // Writes one event for core, in whatever transaction the caller holds — so a state change and its event commit
  // together
  async record(
    intent: PaymentIntent,
    type: PaymentEventType,
    extra: Record<string, unknown> = {},
  ): Promise<PaymentEventDto> {
    const amount = CurrencyAmountDto.from(intent.amount, intent.currency);
    const row = await this.events.create({
      organizationId: intent.organizationId,
      intentId: intent.id,
      type,
      payload: {
        paymentIntentId: intent.id,
        appId: intent.appId,
        partyId: intent.partyId,
        legalEntityId: intent.legalEntityId,
        siteId: intent.siteId,
        configId: intent.configId,
        reference: { type: intent.referenceType, id: intent.referenceId },
        amount: { currency: amount.currency, value: amount.value },
        method: intent.method,
        providerPaymentId: intent.providerPaymentId,
        paidAt: intent.succeededAt?.toISOString() ?? null,
        failure: intent.failureCode ? { code: intent.failureCode, message: intent.failureMessage } : null,
        metadata: intent.metadata,
        ...extra,
      },
    });
    return PaymentEventDto.from(row);
  }

  // The events core has not acknowledged yet, oldest first
  async pending(limit: number): Promise<PaymentEventDto[]> {
    const rows = await this.events.findPending(limit);
    return rows.map((row) => PaymentEventDto.from(row));
  }

  // Marks the events core has dispatched; answers how many it marked
  async ack(ids: string[]): Promise<number> {
    const acked = await this.events.ack(ids, new Date());
    this.logger.log(`events.ack — ${acked}/${ids.length}`);
    return acked;
  }
}
