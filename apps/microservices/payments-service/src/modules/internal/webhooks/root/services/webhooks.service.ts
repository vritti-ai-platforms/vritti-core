import { GatewayRegistry } from '@domain/gateways/gateway-registry';
import type { NormalizedWebhookEvent } from '@domain/gateways/gateway-transport';
import type { PaymentEventDto } from '@domain/payment-events/dto/entity/payment-event.dto';
import { PaymentTransfersDomainService } from '@domain/payment-transfers/services/payment-transfers.service';
import type { WebhookIngestResultDto } from '@domain/webhook-events/dto/entity/webhook-ingest-result.dto';
import type { IngestWebhookDto } from '@domain/webhook-events/dto/request/ingest-webhook.dto';
import { WebhookEventsDomainService } from '@domain/webhook-events/services/webhook-events.service';
import { Injectable, Logger } from '@nestjs/common';
import { ServiceUnavailableException, UnauthorizedException } from '@vritti/api-sdk/exceptions';
import { type WebhookEventStatus, WebhookEventStatusValues } from '@/db/schema';
import { PaymentLifecycleService } from '@/modules/payment-lifecycle/services/payment-lifecycle.service';

// A stored event in one of these states has not been acted on to completion, so a redelivery acts on it again
const RETRYABLE: readonly WebhookEventStatus[] = [WebhookEventStatusValues.RECEIVED, WebhookEventStatusValues.FAILED];

// Thrown inside `handle` for an event that cannot be applied yet but will be once something in flight commits
class RetryLaterError extends Error {}

// Composes what a webhook touches — the gateway transport that verifies and parses it, the event store that
// remembers it, the payment lifecycle it advances and the transfers it updates. Domain modules never import each other, so the handshake is
// orchestrated here rather than inside any of them.
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly registry: GatewayRegistry,
    private readonly eventsService: WebhookEventsDomainService,
    private readonly transfersService: PaymentTransfersDomainService,
    private readonly lifecycle: PaymentLifecycleService,
  ) {}

  // Verifies the signature with the secret core decrypted for this call, records the events it carries, then acts
  // on the newly stored ones; the secret is used once here and written nowhere
  async ingest(dto: IngestWebhookDto): Promise<WebhookIngestResultDto> {
    const transport = this.registry.resolve(dto.gatewayCode);

    if (!dto.webhookSecret) {
      throw new UnauthorizedException({
        label: 'Invalid Webhook Signature',
        detail: 'This gateway has no webhook secret configured, so the signature could not be verified.',
      });
    }
    if (!transport.verifyWebhook(dto.webhookSecret, dto.rawBody, dto.headers)) {
      throw new UnauthorizedException({
        label: 'Invalid Webhook Signature',
        detail: 'The signature on this webhook does not match the configured secret.',
      });
    }

    const events = transport.parseWebhook(dto.rawBody, dto.headers);
    this.logger.log(`Verified ${dto.gatewayCode} webhook for config ${dto.configId} — ${events.length} event(s)`);

    const recorded = await this.eventsService.record({
      organizationId: dto.organizationId,
      configId: dto.configId,
      gatewayCode: dto.gatewayCode,
      rawBody: dto.rawBody,
      events: events.map((event) => ({
        dedupeKey: event.dedupeKey,
        providerEventId: event.providerEventId,
        eventType: event.eventType,
        payload: event.raw,
      })),
    });

    // A first delivery is acted on, and so is a redelivery of one never finished (still RECEIVED, or FAILED);
    // one already processed or ignored is not acted on twice
    const paymentEvents: PaymentEventDto[] = [];
    for (const [index, entry] of recorded.entries()) {
      if (entry.inserted || RETRYABLE.includes(entry.status)) {
        paymentEvents.push(...(await this.handle(entry.id, events[index])));
      }
    }

    return {
      accepted: true,
      duplicate: recorded.some((entry) => !entry.inserted),
      eventIds: recorded.map((entry) => entry.id),
      paymentEvents,
    };
  }

  // Acts on one stored event. A failure is recorded on the event and then thrown as a 503, so core answers the
  // gateway with an error and the gateway redelivers — the redelivery finds the event FAILED and acts on it again
  private async handle(eventId: string, event: NormalizedWebhookEvent): Promise<PaymentEventDto[]> {
    try {
      if (event.transfer) {
        const result = await this.transfersService.applyTransferEvent(event.transfer);
        if (result.outcome === 'in_flight') {
          throw new RetryLaterError('The transfer this event names is still being sent to the gateway.');
        }
        if (result.outcome === 'unknown') {
          await this.eventsService.markIgnored(eventId, 'No transfer created by this platform carries this id.');
        } else {
          await this.eventsService.markProcessed(eventId);
        }
        return [];
      }

      if (event.payment) {
        const result = await this.lifecycle.applyWebhookPayment(event);
        if (result) {
          await this.eventsService.markProcessed(eventId);
          return result.events;
        }
        await this.eventsService.markIgnored(eventId, 'No payment intent opened by this platform owns this order.');
        return [];
      }

      await this.eventsService.markIgnored(eventId, 'This event type carries nothing to act on.');
      return [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Webhook event could not be applied.';
      this.logger.error(`Event ${eventId} (${event.eventType}) failed: ${message}`);
      try {
        await this.eventsService.markFailed(eventId, message);
      } catch (markError) {
        // The event stays RECEIVED, which a redelivery retries just the same
        const reason = markError instanceof Error ? markError.message : 'unknown error';
        this.logger.error(`Event ${eventId} could not be marked failed: ${reason}`);
      }
      throw new ServiceUnavailableException({
        label: 'Webhook Processing Failed',
        detail: 'The webhook event could not be applied right now. The gateway will deliver it again.',
      });
    }
  }
}
