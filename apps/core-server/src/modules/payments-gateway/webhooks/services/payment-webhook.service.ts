import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { FastifyRequest } from 'fastify';
import { PaymentEventDispatcherService } from '../../events/services/payment-event-dispatcher.service';
import type { PaymentEventResponseDto } from '../../intents/dto/response/payment-event-response.dto';

export interface PaymentWebhookIngestResult {
  accepted: boolean;
  duplicate: boolean;
  eventIds: string[];
}

interface PaymentsIngestResponse extends PaymentWebhookIngestResult {
  paymentEvents?: PaymentEventResponseDto[];
}

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    private readonly db: PrimaryDatabaseService,
    private readonly configService: PaymentGatewayConfigDomainService,
    private readonly nats: NatsClientService,
    private readonly dispatcher: PaymentEventDispatcherService,
  ) {}

  // Resolves the config the URL names under its organization, stamps that organization on the request, and
  // forwards the signed body
  async ingest(
    request: FastifyRequest,
    orgId: string,
    gatewayCode: string,
    configId: string,
  ): Promise<PaymentWebhookIngestResult> {
    const rawBody = request.rawBody as string | undefined;
    // The body is what the provider signed over and the secret is what checks it — neither is ever logged
    this.logger.log(
      `[payment-webhook] POST received — org=${orgId} gateway=${gatewayCode} config=${configId} bytes=${rawBody?.length ?? 0}`,
    );

    if (!rawBody) throw new BadRequestException('Webhook body is required.');

    // A public route carries no auth, so the request interceptor sets no RLS context and the org-isolation policy
    // would hide every config. The organization in the URL is the one cloud wrote into the webhook url, so the
    // row is read under its context — and still has to prove it belongs to that organization before anything moves.
    const target = await this.db.runWithRlsContext({ orgId }, () =>
      this.configService.findWebhookTarget(orgId, configId),
    );
    if (!target || target.gatewayCode !== gatewayCode) {
      this.logger.warn(`[payment-webhook] no ${gatewayCode} config ${configId} in org ${orgId} — ignoring`);
      throw new NotFoundException('Payment gateway config not found.');
    }

    // The NATS context resolver reads request.auth, and a public webhook has none. The config row is what
    // authenticated this call so far (payments-service checks the signature next), so stamping its organization
    // here is the same move the WhatsApp webhook makes — without it the service runs with app.org_id unset.
    request.auth = { kind: 'cloud', organizationId: orgId };

    this.logger.log(`[payment-webhook] → payments.webhooks.ingest for org ${orgId}`);
    // Not caught: when payments-service could not record the event it answers 503, and that has to reach the
    // provider as a non-2xx so it redelivers
    const { paymentEvents, ...result } = await this.nats.send<PaymentsIngestResponse>(
      'payments',
      'payments.webhooks.ingest',
      {
        organizationId: orgId,
        configId,
        gatewayCode,
        webhookSecret: target.webhookSecret,
        rawBody,
        headers: flattenHeaders(request.headers),
      },
    );

    // Settles orders and queues app webhooks for what the provider just reported. It never throws — anything that
    // fails stays unacknowledged in payments-service for the sweep — so the provider still gets its 200 and does not
    // redeliver a webhook that was already recorded. The provider sees only the ingest outcome, never the events
    if (paymentEvents && paymentEvents.length > 0) {
      await this.dispatcher.dispatch(orgId, paymentEvents);
    }
    return result;
  }
}

// Lower-cases header names and joins repeated values, dropping anything that arrived without one
function flattenHeaders(headers: FastifyRequest['headers']): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    out[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value;
  }
  return out;
}
