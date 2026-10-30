import { Injectable, Logger } from '@nestjs/common';
import { type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import { ScopedNatsClientService } from '@/services/scoped-nats-client.service';
import {
  type PaymentEventResponseDto,
  PaymentEventTypeValues,
} from '../../intents/dto/response/payment-event-response.dto';
import type { PaymentEventHandler } from '../payment-event-handler';

export const COMMERCE_CHECKOUT_REFERENCE_TYPE = 'commerce.checkout';

// Settles a commerce checkout from its payment: a success turns it into one paid order per store, an expiry or a
// cancellation cancels the unpaid checkout, a failure leaves it open for another attempt. Organization-scoped, since
// a checkout reaches across stores
@Injectable()
export class CheckoutPaymentHandlerService implements PaymentEventHandler {
  readonly referenceType = COMMERCE_CHECKOUT_REFERENCE_TYPE;
  private readonly logger = new Logger(CheckoutPaymentHandlerService.name);

  constructor(private readonly nats: ScopedNatsClientService) {}

  // Routes one event by type; every branch is idempotent on the commerce side
  async handle(orgId: string, event: PaymentEventResponseDto): Promise<void> {
    if (event.type === PaymentEventTypeValues.SUCCEEDED) return this.complete(orgId, event);
    if (event.type === PaymentEventTypeValues.EXPIRED) {
      return this.cancel(orgId, event, 'Payment expired before it was completed.');
    }
    if (event.type === PaymentEventTypeValues.CANCELED) return this.cancel(orgId, event, 'Payment was cancelled.');
  }

  private async complete(orgId: string, event: PaymentEventResponseDto): Promise<void> {
    const { payload } = event;
    const amountMinor = majorToMinor(payload.amount.value, payload.amount.currency as CurrencyCode).toString();
    this.logger.log(`org.checkouts.complete — checkout: ${payload.reference.id} intent: ${payload.paymentIntentId}`);
    await this.nats.send({ orgId }, 'commerce', 'org.checkouts.complete', {
      checkoutId: payload.reference.id,
      paymentIntentId: payload.paymentIntentId,
      method: payload.method,
      providerPaymentId: payload.providerPaymentId,
      amountMinor,
      currency: payload.amount.currency,
      paidAt: payload.paidAt,
    });
  }

  private async cancel(orgId: string, event: PaymentEventResponseDto, reason: string): Promise<void> {
    const { payload } = event;
    this.logger.log(`org.checkouts.cancel — checkout: ${payload.reference.id} intent: ${payload.paymentIntentId}`);
    await this.nats.send({ orgId }, 'commerce', 'org.checkouts.cancel', {
      checkoutId: payload.reference.id,
      reason,
      paymentIntentId: payload.paymentIntentId,
    });
  }
}
