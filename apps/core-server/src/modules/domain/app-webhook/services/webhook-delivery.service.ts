import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { and, eq } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type WebhookDelivery, WebhookDeliveryStatusValues, webhookDeliveries } from '@/db/schema';
import { WebhookDeliveryDto } from '../dto/entity/webhook-delivery.dto';
import type { WebhookDeliveriesPageResponseDto } from '../dto/response/webhook-deliveries-page-response.dto';
import { AppWebhookEndpointDomainRepository } from '../repositories/app-webhook-endpoint.repository';
import {
  WebhookDeliveryDomainRepository,
  type WebhookDeliveryTarget,
} from '../repositories/webhook-delivery.repository';
import { findBlockedDestination } from '../webhook-destination';
import { scheduleAfterFailedAttempt } from '../webhook-retry-schedule';
import { signWebhookPayload } from '../webhook-signature';

export const WEBHOOK_TEST_EVENT_TYPE = 'webhook.test';

const DELIVERY_TIMEOUT_MS = 10_000;
const CLAIM_LEASE_MS = 10 * 60 * 1000;
const CLAIM_BATCH = 25;
const MAX_ERROR_LENGTH = 500;

export interface WebhookEventInput {
  id: string;
  type: string;
  payload: Record<string, unknown>;
}

export interface WebhookDeliveryRunResult {
  attempted: number;
  delivered: number;
  failed: number;
}

interface AttemptOutcome {
  ok: boolean;
  statusCode: number | null;
  error: string | null;
  // Set when the delivery can never be sent as things stand, so it fails now instead of working through retries
  terminal?: boolean;
}

@Injectable()
export class WebhookDeliveryDomainService {
  private readonly logger = new Logger(WebhookDeliveryDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    eventId: { column: webhookDeliveries.eventId, type: 'string' },
    eventType: { column: webhookDeliveries.eventType, type: 'string' },
    status: { column: webhookDeliveries.status, type: 'string' },
    attempts: { column: webhookDeliveries.attempts, type: 'number' },
    lastStatusCode: { column: webhookDeliveries.lastStatusCode, type: 'number' },
    nextAttemptAt: { column: webhookDeliveries.nextAttemptAt, type: 'string' },
    deliveredAt: { column: webhookDeliveries.deliveredAt, type: 'string' },
    createdAt: { column: webhookDeliveries.createdAt, type: 'string' },
  };

  constructor(
    private readonly deliveryRepository: WebhookDeliveryDomainRepository,
    private readonly endpointRepository: AppWebhookEndpointDomainRepository,
  ) {}

  // Queues an event for the app when it has an active endpoint subscribed to that type; null when nothing was queued
  async enqueueEvent(organizationId: string, appId: string, event: WebhookEventInput): Promise<string | null> {
    const endpoint = await this.endpointRepository.findByApp(organizationId, appId);
    if (!endpoint || !endpoint.isActive || !endpoint.events.includes(event.type)) return null;

    const delivery = await this.deliveryRepository.insertOnce({
      organizationId,
      appId,
      endpointId: endpoint.id,
      eventId: event.id,
      eventType: event.type,
      payload: event.payload,
    });
    if (delivery) this.logger.log(`Queued webhook ${delivery.id} — app ${appId} event ${event.id} (${event.type})`);
    return delivery?.id ?? null;
  }

  // Queues a test event to the app's endpoint whatever it subscribes to
  async enqueueTest(organizationId: string, appId: string): Promise<{ deliveryId: string }> {
    const endpoint = await this.endpointRepository.findByApp(organizationId, appId);
    if (!endpoint) {
      throw new NotFoundException({
        label: 'Webhook Endpoint Not Found',
        detail: 'Register a webhook endpoint for this app before sending a test event.',
      });
    }

    const delivery = await this.deliveryRepository.insertOnce({
      organizationId,
      appId,
      endpointId: endpoint.id,
      eventId: `test_${randomUUID()}`,
      eventType: WEBHOOK_TEST_EVENT_TYPE,
      payload: { message: 'Test event from Vritti' },
    });
    if (!delivery) {
      throw new InternalServerErrorException({
        label: 'Test Not Queued',
        detail: 'The test event could not be queued. Try sending it again.',
      });
    }

    this.logger.log(`Queued test webhook ${delivery.id} for app ${appId}`);
    return { deliveryId: delivery.id };
  }

  // Returns a page of the app's deliveries for the data table
  async findForTable(
    organizationId: string,
    appId: string,
    state: TableViewState,
  ): Promise<WebhookDeliveriesPageResponseDto> {
    const { filters, search, sort, pagination } = state;
    const where = and(
      eq(webhookDeliveries.organizationId, organizationId),
      eq(webhookDeliveries.appId, appId),
      FilterProcessor.buildWhere(filters, WebhookDeliveryDomainService.FIELD_MAP),
      FilterProcessor.buildSearch(search, WebhookDeliveryDomainService.FIELD_MAP),
    );
    const orderBy = FilterProcessor.buildOrderBy(sort, WebhookDeliveryDomainService.FIELD_MAP);

    const { result, count } = await this.deliveryRepository.findForTable({
      where,
      orderBy,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { result: result.map(WebhookDeliveryDto.from), count };
  }

  // Puts a delivery back in the queue for an immediate attempt with a fresh retry budget. A delivery a worker is
  // sending, or one already waiting on its next retry, is still in progress and is refused
  async redeliver(organizationId: string, appId: string, deliveryId: string): Promise<{ deliveryId: string }> {
    const delivery = await this.deliveryRepository.findForApp(organizationId, appId, deliveryId);
    if (!delivery) {
      throw new NotFoundException({
        label: 'Delivery Not Found',
        detail: 'That webhook delivery does not exist for this app.',
      });
    }

    const requeued = await this.deliveryRepository.requeueIfIdle(delivery.id, new Date());
    if (!requeued) {
      throw new ConflictException({
        label: 'Delivery In Progress',
        detail: 'This delivery is being sent or is waiting on its next retry. Try again once it has finished.',
      });
    }
    this.logger.log(`Requeued webhook ${delivery.id} for app ${appId}`);
    return { deliveryId: delivery.id };
  }

  // Sends the organization's due deliveries once each and records every outcome. The caller supplies the RLS context
  async deliverDue(organizationId: string, now: Date = new Date()): Promise<WebhookDeliveryRunResult> {
    const claimed = await this.deliveryRepository.claimDue(
      organizationId,
      now,
      new Date(now.getTime() + CLAIM_LEASE_MS),
      CLAIM_BATCH,
    );
    const targets = await this.deliveryRepository.findTargets(claimed);

    const result: WebhookDeliveryRunResult = { attempted: 0, delivered: 0, failed: 0 };
    for (const target of targets) {
      const outcome = await this.attempt(target);
      await this.record(target.delivery, outcome);
      result.attempted++;
      if (outcome.ok) result.delivered++;
      else result.failed++;
    }
    return result;
  }

  // POSTs one signed delivery. Redirects are not followed, so a 3xx counts as a failure rather than a hop elsewhere.
  // Nothing is sent for an inactive or revoked app, or when the host now resolves to a private address
  private async attempt(target: WebhookDeliveryTarget): Promise<AttemptOutcome> {
    const { delivery } = target;
    if (!target.appActive) return { ok: false, statusCode: null, error: 'App inactive', terminal: true };

    const blocked = await findBlockedDestination(target.url);
    if (blocked) {
      this.logger.warn(`Webhook ${delivery.id} not sent — ${blocked}`);
      return { ok: false, statusCode: null, error: 'Blocked destination', terminal: true };
    }

    const rawBody = JSON.stringify({
      id: delivery.eventId,
      type: delivery.eventType,
      createdAt: delivery.createdAt.toISOString(),
      data: delivery.payload,
    });
    const timestamp = Math.floor(Date.now() / 1000).toString();

    try {
      const signature = signWebhookPayload(target.signingKey, timestamp, rawBody);
      const response = await fetch(target.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-vap-event-id': delivery.eventId,
          'x-vap-timestamp': timestamp,
          'x-vap-signature': signature,
        },
        body: rawBody,
        redirect: 'manual',
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });
      // The receiver's body is never read — it is not ours to log
      await response.body?.cancel();
      const ok = response.status >= 200 && response.status < 300;
      return { ok, statusCode: response.status, error: ok ? null : `HTTP ${response.status}` };
    } catch (error: unknown) {
      const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      return { ok: false, statusCode: null, error: message.slice(0, MAX_ERROR_LENGTH) };
    }
  }

  // Stores an attempt's outcome and, on failure, schedules the next try or gives up
  private async record(delivery: WebhookDelivery, outcome: AttemptOutcome): Promise<void> {
    const attempts = delivery.attempts + 1;
    const now = new Date();

    if (outcome.ok) {
      await this.deliveryRepository.update(delivery.id, {
        status: WebhookDeliveryStatusValues.DELIVERED,
        attempts,
        lastStatusCode: outcome.statusCode,
        lastError: null,
        deliveredAt: now,
      });
      this.logger.log(`Delivered webhook ${delivery.id} (event ${delivery.eventId}) — ${outcome.statusCode}`);
      return;
    }

    const next = outcome.terminal
      ? { status: WebhookDeliveryStatusValues.FAILED, nextAttemptAt: now }
      : scheduleAfterFailedAttempt(attempts, now);
    await this.deliveryRepository.update(delivery.id, {
      status: next.status,
      attempts,
      lastStatusCode: outcome.statusCode,
      lastError: outcome.error,
      nextAttemptAt: next.nextAttemptAt,
    });
    this.logger.warn(
      `Webhook ${delivery.id} (event ${delivery.eventId}) attempt ${attempts} failed — ${outcome.error}; now ${next.status}`,
    );
  }
}
