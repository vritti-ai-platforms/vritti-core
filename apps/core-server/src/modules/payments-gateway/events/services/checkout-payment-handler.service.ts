import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { Injectable, Logger } from '@nestjs/common';
import { type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import { ScopedNatsClientService } from '@/services/scoped-nats-client.service';
import {
  type PaymentEventResponseDto,
  PaymentEventTypeValues,
} from '../../intents/dto/response/payment-event-response.dto';
import type { PaymentEventHandler } from '../payment-event-handler';
import { isDefinitiveRejection } from '../payment-rejection';

export const COMMERCE_CHECKOUT_REFERENCE_TYPE = 'commerce.checkout';

// Settles a commerce checkout from its payments: a success turns it into one paid order per store. A checkout may
// have several payments (a retry, another gateway), so one payment expiring, failing or being cancelled leaves the
// checkout alone — it ends by its own deadline. A success commerce refuses for good (the checkout was already paid by
// another payment, it was replaced, or the amount does not match) is refunded in full, so no money is kept without an
// order; staff follow the refund on the order's payments. Organization-scoped, since a checkout reaches across stores
@Injectable()
export class CheckoutPaymentHandlerService implements PaymentEventHandler {
  readonly referenceType = COMMERCE_CHECKOUT_REFERENCE_TYPE;
  private readonly logger = new Logger(CheckoutPaymentHandlerService.name);

  constructor(
    private readonly nats: ScopedNatsClientService,
    private readonly configService: PaymentGatewayConfigDomainService,
  ) {}

  // Every branch is idempotent: commerce answers a repeated completion as before, and the gateway refuses a second
  // refund, which the dispatcher treats as final
  async handle(orgId: string, event: PaymentEventResponseDto): Promise<void> {
    if (event.type !== PaymentEventTypeValues.SUCCEEDED) return;
    try {
      await this.complete(orgId, event);
    } catch (error: unknown) {
      if (!isDefinitiveRejection(error)) throw error;
      this.logger.error(
        `Checkout ${event.payload.reference.id} refused payment ${event.payload.paymentIntentId} (${error instanceof Error ? error.message : String(error)}) — refunding it`,
      );
      await this.refund(orgId, event);
    }
  }

  private async complete(orgId: string, event: PaymentEventResponseDto): Promise<void> {
    const { payload } = event;
    const amountMinor = majorToMinor(payload.amount.value, payload.amount.currency as CurrencyCode).toString();
    this.logger.log(`org.checkouts.complete — checkout: ${payload.reference.id} intent: ${payload.paymentIntentId}`);
    await this.nats.send({ orgId }, 'commerce', 'org.checkouts.complete', {
      checkoutId: payload.reference.id,
      paymentIntentId: payload.paymentIntentId,
      amountMinor,
      currency: payload.amount.currency,
      paidAt: payload.paidAt,
    });
  }

  private async refund(orgId: string, event: PaymentEventResponseDto): Promise<void> {
    const { credentials } = await this.configService.getDecryptedCredentials(event.payload.configId);
    this.logger.log(`payments.intents.refund — refused checkout payment ${event.payload.paymentIntentId}`);
    await this.nats.send({ orgId }, 'payments', 'payments.intents.refund', {
      paymentIntentId: event.payload.paymentIntentId,
      credentials,
    });
  }
}
