import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InternalServerErrorException } from '@vritti/api-sdk/exceptions';
import { WebhookEventStatusValues } from '@/db/schema';
import type { RecordedWebhookEvent, RecordWebhookEventsInput } from '../dto/request/record-webhook-events.dto';
import { WebhookEventsDomainRepository } from '../repositories/webhook-events.repository';

@Injectable()
export class WebhookEventsDomainService {
  private readonly logger = new Logger(WebhookEventsDomainService.name);

  constructor(private readonly repository: WebhookEventsDomainRepository) {}

  // Stores each already-verified event once per organization, keyed by (gateway, dedupe key). A stored event
  // stays RECEIVED until something acts on it — it is never marked processed just for being stored.
  async record(input: RecordWebhookEventsInput): Promise<RecordedWebhookEvent[]> {
    const payloadHash = createHash('sha256').update(input.rawBody).digest('hex');
    const recorded: RecordedWebhookEvent[] = [];

    for (const event of input.events) {
      const created = await this.repository.insertIfNew({
        organizationId: input.organizationId,
        configId: input.configId,
        gatewayCode: input.gatewayCode,
        dedupeKey: event.dedupeKey,
        providerEventId: event.providerEventId,
        eventType: event.eventType,
        payloadHash,
        payload: event.payload,
        status: WebhookEventStatusValues.RECEIVED,
      });

      if (created) {
        recorded.push({ id: created.id, inserted: true, status: created.status });
        this.logger.log(
          `Stored ${input.gatewayCode} event ${event.providerEventId} (${event.eventType}) as ${created.id}`,
        );
        continue;
      }

      const existing = await this.repository.findByDedupeKey(input.gatewayCode, event.dedupeKey);
      if (!existing) {
        // The insert hit the constraint yet the row is not visible — only possible if the organization changed
        // mid-request, so refuse rather than report a duplicate that cannot be shown
        throw new InternalServerErrorException('The webhook event could not be stored.');
      }
      recorded.push({ id: existing.id, inserted: false, status: existing.status });
      this.logger.log(
        `Duplicate ${input.gatewayCode} event ${event.providerEventId} — already stored as ${existing.id} (${existing.status})`,
      );
    }

    return recorded;
  }

  // Marks an event acted on
  async markProcessed(id: string): Promise<void> {
    await this.repository.markProcessed(id);
  }

  // Marks an event that needs no action (e.g. a transfer this platform never created)
  async markIgnored(id: string, reason: string): Promise<void> {
    await this.repository.markIgnored(id, reason);
  }

  // Marks an event whose handling failed, keeping the reason for a later retry
  async markFailed(id: string, error: string): Promise<void> {
    await this.repository.markFailed(id, error);
  }
}
