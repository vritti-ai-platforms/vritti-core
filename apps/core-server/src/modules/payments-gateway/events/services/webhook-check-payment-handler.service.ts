import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { Injectable, Logger } from '@nestjs/common';
import { ScopedNatsClientService } from '@/services/scoped-nats-client.service';
import {
  type PaymentEventResponseDto,
  PaymentEventTypeValues,
} from '../../intents/dto/response/payment-event-response.dto';
import type { PaymentEventHandler } from '../payment-event-handler';

// The reference of a verification payment: the small payment that makes a gateway send its first signed webhook to
// a config's URL. Its id is the config's
export const GATEWAY_WEBHOOK_CHECK_REFERENCE_TYPE = 'vritti.webhook-check';

// Gives a verification payment's money back once it has succeeded — it was only ever taken to trigger a webhook.
// Whichever arrives first, the browser's confirm or the webhook, settles the payment and lands here; the gateway
// refuses a second refund, which the dispatcher treats as final
@Injectable()
export class WebhookCheckPaymentHandlerService implements PaymentEventHandler {
  readonly referenceType = GATEWAY_WEBHOOK_CHECK_REFERENCE_TYPE;
  private readonly logger = new Logger(WebhookCheckPaymentHandlerService.name);

  constructor(
    private readonly nats: ScopedNatsClientService,
    private readonly configService: PaymentGatewayConfigDomainService,
  ) {}

  async handle(orgId: string, event: PaymentEventResponseDto): Promise<void> {
    if (event.type !== PaymentEventTypeValues.SUCCEEDED) return;
    const { credentials } = await this.configService.getDecryptedCredentials(event.payload.configId);
    this.logger.log(`payments.intents.refund — verification payment ${event.payload.paymentIntentId}`);
    await this.nats.send({ orgId }, 'payments', 'payments.intents.refund', {
      paymentIntentId: event.payload.paymentIntentId,
      credentials,
    });
  }
}
