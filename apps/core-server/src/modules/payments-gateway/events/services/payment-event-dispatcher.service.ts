import { WebhookDeliveryDomainService } from '@domain/app-webhook/services/webhook-delivery.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { ScopedNatsClientService } from '@/services/scoped-nats-client.service';
import type { PaymentEventResponseDto } from '../../intents/dto/response/payment-event-response.dto';
import type { PaymentEventHandler } from '../payment-event-handler';
import { errorStatus, isDefinitiveRejection } from '../payment-rejection';
import { CommerceOrderPaymentHandlerService } from './commerce-order-payment-handler.service';

export interface PaymentDispatchResult {
  dispatched: number;
  failed: number;
  acked: number;
}

// Fans payment events out to core: the internal handler for what the intent paid for, then the paying app's
// webhook. An event is acknowledged to payments-service once both have gone through, or once its handler was refused
// for good (a 4xx such as Already Paid) — repeating that can never succeed, so it is logged and the webhook still
// queued. Anything transient (timeouts, no responders, 5xx) stays unacknowledged so the pending-events sweep retries
// it. Handlers and the webhook queue are idempotent per event.
@Injectable()
export class PaymentEventDispatcherService {
  private readonly logger = new Logger(PaymentEventDispatcherService.name);
  private readonly handlers = new Map<string, PaymentEventHandler>();

  constructor(
    private readonly nats: ScopedNatsClientService,
    private readonly deliveries: WebhookDeliveryDomainService,
    private readonly db: PrimaryDatabaseService,
    commerceOrderHandler: CommerceOrderPaymentHandlerService,
  ) {
    this.register(commerceOrderHandler);
  }

  // Adds the handler for one reference type; a second registration for the same type is a wiring bug
  register(handler: PaymentEventHandler): void {
    if (this.handlers.has(handler.referenceType)) {
      throw new Error(`A payment event handler for "${handler.referenceType}" is already registered`);
    }
    this.handlers.set(handler.referenceType, handler);
  }

  // Dispatches a batch for one organization and acknowledges what went through. Never throws for a failed event
  async dispatch(orgId: string, events: PaymentEventResponseDto[]): Promise<PaymentDispatchResult> {
    if (events.length === 0) return { dispatched: 0, failed: 0, acked: 0 };

    return this.db.runWithRlsContext({ orgId }, async () => {
      const handled: string[] = [];
      let failed = 0;

      for (const event of events) {
        try {
          await this.dispatchOne(orgId, event);
          handled.push(event.id);
        } catch (error: unknown) {
          failed++;
          this.logger.warn(
            `Payment event ${event.id} (${event.type}) of intent ${event.intentId} failed — ${describe(error)}; left for the sweep`,
          );
        }
      }

      const acked = await this.ack(orgId, handled);
      return { dispatched: handled.length, failed, acked };
    });
  }

  private async dispatchOne(orgId: string, event: PaymentEventResponseDto): Promise<void> {
    const handler = this.handlers.get(event.payload.reference?.type);
    if (handler) await this.runHandler(handler, orgId, event);

    if (event.payload.appId) {
      await this.deliveries.enqueueEvent(orgId, event.payload.appId, {
        id: event.id,
        type: event.type,
        payload: { ...event.payload },
      });
    }
  }

  // Runs the handler, absorbing a definitive rejection as terminal; a transient failure propagates and stays unacked
  private async runHandler(handler: PaymentEventHandler, orgId: string, event: PaymentEventResponseDto): Promise<void> {
    try {
      await handler.handle(orgId, event);
    } catch (error: unknown) {
      if (!isDefinitiveRejection(error)) throw error;
      this.logger.error(
        `Payment event ${event.id} (${event.type}) of intent ${event.intentId} for ${event.payload.reference?.type}:${event.payload.reference?.id} in org ${orgId} was rejected for good (${errorStatus(error)}) — ${describe(error)}; acknowledging without settling`,
      );
    }
  }

  // Acknowledges dispatched events; a failed ack only means they are dispatched again, which every step tolerates
  private async ack(orgId: string, ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    try {
      const { acked } = await this.nats.send<{ acked: number }>({ orgId }, 'payments', 'payments.events.ack', { ids });
      return acked;
    } catch (error: unknown) {
      this.logger.warn(`Acknowledging ${ids.length} payment events for org ${orgId} failed — ${describe(error)}`);
      return 0;
    }
  }
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const problem = error as { label?: unknown; detail?: unknown; message?: unknown };
    const text = [problem.label, problem.detail ?? problem.message].filter((part) => typeof part === 'string');
    if (text.length > 0) return text.join(': ');
  }
  return String(error);
}
