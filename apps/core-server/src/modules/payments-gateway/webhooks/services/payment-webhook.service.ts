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

  // Resolves the config the URL names under its organization, stamps that organization on the request, and forwards the
  // signed body
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

    const target = await this.db.runWithRlsContext({ orgId }, () => this.configService.findWebhookTarget(configId));
    if (!target || target.gatewayCode !== gatewayCode) {
      this.logger.warn(`[payment-webhook] no ${gatewayCode} config ${configId} in org ${orgId} — ignoring`);
      throw new NotFoundException('Payment gateway config not found.');
    }

    // The NATS context resolver reads request.auth, and a public webhook has none.
    request.auth = { kind: 'cloud', organizationId: orgId };

    this.logger.log(`[payment-webhook] → payments.webhooks.ingest for org ${orgId}`);
    // Not caught: when payments-service could not record the event it answers 503, and that has to reach the provider
    // as a non-2xx so it redelivers
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

    // payments-service answers only once the signature matched, so this webhook proves the URL and secret registered
    // at the gateway. Never fails the delivery: a missed stamp is caught by the next webhook
    await this.db
      .runWithRlsContext({ orgId }, () => this.configService.markWebhookReceived(configId))
      .catch((error: unknown) =>
        this.logger.warn(
          `[payment-webhook] could not stamp config ${configId}: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );

    // Settles orders and queues app webhooks for what the provider just reported.
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
