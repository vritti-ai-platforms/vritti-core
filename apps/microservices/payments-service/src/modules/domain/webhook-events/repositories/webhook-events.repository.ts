import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { type NewWebhookEvent, type WebhookEvent, WebhookEventStatusValues, webhookEvents } from '@/db/schema';

@Injectable()
export class WebhookEventsDomainRepository extends PrimaryBaseRepository<typeof webhookEvents> {
  constructor(database: PrimaryDatabaseService) {
    super(database, webhookEvents);
  }

  // Inserts the event unless the organization already holds one with the same (gateway, dedupe key). One
  // statement, so two concurrent retries cannot both pass a check and then race on the constraint.
  async insertIfNew(data: NewWebhookEvent): Promise<WebhookEvent | undefined> {
    const [row] = (await this.db
      .insert(webhookEvents)
      .values(data)
      .onConflictDoNothing({
        target: [webhookEvents.organizationId, webhookEvents.gatewayCode, webhookEvents.dedupeKey],
      })
      .returning()) as WebhookEvent[];
    return row;
  }

  // Finds the stored copy of a delivery; RLS scopes it to the request's organization
  async findByDedupeKey(gatewayCode: string, dedupeKey: string): Promise<WebhookEvent | undefined> {
    return this.model.findFirst({
      where: { gatewayCode, dedupeKey },
    });
  }

  async markProcessed(id: string): Promise<WebhookEvent> {
    return this.update(id, { status: WebhookEventStatusValues.PROCESSED, processedAt: new Date(), error: null });
  }

  async markIgnored(id: string, reason: string): Promise<WebhookEvent> {
    return this.update(id, { status: WebhookEventStatusValues.IGNORED, processedAt: new Date(), error: reason });
  }

  async markFailed(id: string, error: string): Promise<WebhookEvent> {
    return this.update(id, { status: WebhookEventStatusValues.FAILED, processedAt: new Date(), error });
  }
}
