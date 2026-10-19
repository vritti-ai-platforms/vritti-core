import { Injectable, Logger } from '@nestjs/common';
import { type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import { ScopedNatsClientService } from '@/services/scoped-nats-client.service';
import {
  type PaymentEventResponseDto,
  PaymentEventTypeValues,
} from '../../intents/dto/response/payment-event-response.dto';
import type { PaymentEventHandler } from '../payment-event-handler';

export const COMMERCE_ORDER_REFERENCE_TYPE = 'commerce.order';

// Settles a commerce order from its payment: a success marks it paid, an expiry or a cancellation cancels the unpaid
// order, a failure leaves it open for another attempt. Split transfers return with the org checkout, once intents
// carry payout legs again
@Injectable()
export class CommerceOrderPaymentHandlerService implements PaymentEventHandler {
  readonly referenceType = COMMERCE_ORDER_REFERENCE_TYPE;
  private readonly logger = new Logger(CommerceOrderPaymentHandlerService.name);

  constructor(private readonly nats: ScopedNatsClientService) {}

  // Routes one event by type; every branch is idempotent on the commerce side
  async handle(orgId: string, event: PaymentEventResponseDto): Promise<void> {
    if (event.type === PaymentEventTypeValues.SUCCEEDED) return this.markPaid(orgId, event);
    if (event.type === PaymentEventTypeValues.EXPIRED) {
      return this.cancelUnpaid(orgId, event, 'Payment expired before it was completed.');
    }
    if (event.type === PaymentEventTypeValues.CANCELED)
      return this.cancelUnpaid(orgId, event, 'Payment was cancelled.');
  }

  private async markPaid(orgId: string, event: PaymentEventResponseDto): Promise<void> {
    const { payload } = event;
    const siteId = this.requireSite(event);
    if (!siteId) return;

    const amountMinor = majorToMinor(payload.amount.value, payload.amount.currency as CurrencyCode).toString();
    this.logger.log(`site.orders.markPaid — order: ${payload.reference.id} intent: ${payload.paymentIntentId}`);
    await this.nats.send({ orgId, siteId }, 'commerce', 'site.orders.markPaid', {
      orderId: payload.reference.id,
      paymentIntentId: payload.paymentIntentId,
      method: payload.method,
      providerPaymentId: payload.providerPaymentId,
      amountMinor,
      currency: payload.amount.currency,
      paidAt: payload.paidAt,
    });
  }

  private async cancelUnpaid(orgId: string, event: PaymentEventResponseDto, reason: string): Promise<void> {
    const siteId = this.requireSite(event);
    if (!siteId) return;

    this.logger.log(
      `site.orders.cancelUnpaid — order: ${event.payload.reference.id} intent: ${event.payload.paymentIntentId}`,
    );
    await this.nats.send({ orgId, siteId }, 'commerce', 'site.orders.cancelUnpaid', {
      orderId: event.payload.reference.id,
      reason,
      paymentIntentId: event.payload.paymentIntentId,
    });
  }

  // Order commands are site-scoped.
  private requireSite(event: PaymentEventResponseDto): string | null {
    if (event.payload.siteId) return event.payload.siteId;
    this.logger.error(
      `Payment event ${event.id} (${event.type}) for order ${event.payload.reference.id} has no site — cannot settle the order`,
    );
    return null;
  }
}
