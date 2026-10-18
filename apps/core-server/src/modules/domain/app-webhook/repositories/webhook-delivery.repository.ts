import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, gt, inArray, lte, ne, not, or, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  apps,
  appWebhookEndpoints,
  type NewWebhookDelivery,
  type WebhookDelivery,
  WebhookDeliveryStatusValues,
  webhookDeliveries,
} from '@/db/schema';

export interface WebhookDeliveryTarget {
  delivery: WebhookDelivery;
  url: string;
  signingKey: string;
  appActive: boolean;
}

@Injectable()
export class WebhookDeliveryDomainRepository extends PrimaryBaseRepository<typeof webhookDeliveries> {
  constructor(database: PrimaryDatabaseService) {
    super(database, webhookDeliveries);
  }

  // Queues a delivery once per endpoint and event; a repeat of the same event is ignored and returns undefined
  async insertOnce(values: NewWebhookDelivery): Promise<WebhookDelivery | undefined> {
    const rows = (await this.db
      .insert(webhookDeliveries)
      .values(values)
      .onConflictDoNothing({ target: [webhookDeliveries.endpointId, webhookDeliveries.eventId] })
      .returning()) as WebhookDelivery[];
    return rows[0];
  }

  // Finds a page of deliveries with its total, newest first unless the caller sorts
  async findForTable(params: {
    where: SQL | undefined;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: WebhookDelivery[]; count: number }> {
    return this.findAllAndCount({
      where: params.where,
      orderBy: params.orderBy.length > 0 ? params.orderBy : [desc(webhookDeliveries.createdAt)],
      limit: params.limit,
      offset: params.offset,
    });
  }

  // One delivery, only when it belongs to the app in the organization
  async findForApp(organizationId: string, appId: string, id: string): Promise<WebhookDelivery | undefined> {
    return this.model.findFirst({ where: { id, organizationId, appId } });
  }

  // Requeues a delivery for an immediate first attempt, unless it is PENDING with its next attempt still ahead — leased
  // by a worker that is sending it, or waiting on a scheduled retry.
  async requeueIfIdle(id: string, now: Date): Promise<boolean> {
    const rows = await this.db
      .update(webhookDeliveries)
      .set({
        status: WebhookDeliveryStatusValues.PENDING,
        attempts: 0,
        nextAttemptAt: now,
        lastError: null,
        lastStatusCode: null,
        deliveredAt: null,
      })
      .where(
        and(
          eq(webhookDeliveries.id, id),
          or(
            ne(webhookDeliveries.status, WebhookDeliveryStatusValues.PENDING),
            not(gt(webhookDeliveries.nextAttemptAt, now)),
          ),
        ),
      )
      .returning({ id: webhookDeliveries.id });
    return rows.length > 0;
  }

  // Claims due deliveries by pushing their next attempt out by a lease, so a second worker skips them.
  async claimDue(organizationId: string, now: Date, leaseUntil: Date, limit: number): Promise<WebhookDelivery[]> {
    const due = this.db
      .select({ id: webhookDeliveries.id })
      .from(webhookDeliveries)
      .innerJoin(appWebhookEndpoints, eq(appWebhookEndpoints.id, webhookDeliveries.endpointId))
      .where(
        and(
          eq(webhookDeliveries.organizationId, organizationId),
          eq(webhookDeliveries.status, WebhookDeliveryStatusValues.PENDING),
          lte(webhookDeliveries.nextAttemptAt, now),
          or(eq(appWebhookEndpoints.isActive, true), eq(webhookDeliveries.eventType, 'webhook.test')),
        ),
      )
      .orderBy(asc(webhookDeliveries.nextAttemptAt))
      .limit(limit)
      .for('update', { of: webhookDeliveries, skipLocked: true });

    return (await this.db
      .update(webhookDeliveries)
      .set({ nextAttemptAt: leaseUntil })
      .where(inArray(webhookDeliveries.id, due))
      .returning()) as WebhookDelivery[];
  }

  // Pairs claimed deliveries with the URL they go to and the key that signs them
  async findTargets(deliveries: WebhookDelivery[]): Promise<WebhookDeliveryTarget[]> {
    if (deliveries.length === 0) return [];
    const endpointIds = [...new Set(deliveries.map((delivery) => delivery.endpointId))];
    const rows = await this.db
      .select({
        endpointId: appWebhookEndpoints.id,
        url: appWebhookEndpoints.url,
        signingKey: apps.signingKey,
        appIsActive: apps.isActive,
        appRevokedAt: apps.revokedAt,
      })
      .from(appWebhookEndpoints)
      .innerJoin(apps, eq(apps.id, appWebhookEndpoints.appId))
      .where(inArray(appWebhookEndpoints.id, endpointIds));

    const byEndpoint = new Map(rows.map((row) => [row.endpointId, row]));
    const targets: WebhookDeliveryTarget[] = [];
    for (const delivery of deliveries) {
      const target = byEndpoint.get(delivery.endpointId);
      if (!target) continue;
      targets.push({
        delivery,
        url: target.url,
        signingKey: target.signingKey,
        appActive: target.appIsActive && target.appRevokedAt === null,
      });
    }
    return targets;
  }
}
