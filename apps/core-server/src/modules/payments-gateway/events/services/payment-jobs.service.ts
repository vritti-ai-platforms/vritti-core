import { WebhookDeliveryDomainService } from '@domain/app-webhook/services/webhook-delivery.service';
import { OrganizationDomainRepository } from '@domain/organization/repositories/organization.repository';
import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit, Optional } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { ScopedNatsClientService } from '@/services/scoped-nats-client.service';
import type { PaymentEventResponseDto } from '../../intents/dto/response/payment-event-response.dto';
import { PaymentEventDispatcherService } from './payment-event-dispatcher.service';

export const PAYMENT_JOBS_OPTIONS = Symbol('PAYMENT_JOBS_OPTIONS');

export interface PaymentJobsOptions {
  enabled: boolean;
  eventSweepMs: number;
  expireSweepMs: number;
  deliveryWorkerMs: number;
  batchSize: number;
}

const DEFAULT_OPTIONS: PaymentJobsOptions = {
  // Unit and e2e test processes boot no timers unless a test opts in
  enabled: process.env.NODE_ENV !== 'test',
  eventSweepMs: 60_000,
  expireSweepMs: 5 * 60_000,
  deliveryWorkerMs: 30_000,
  batchSize: 100,
};

type JobName = 'event-sweep' | 'expire-sweep' | 'delivery-worker';

// The payments safety nets, run in-process on timers: drain events payments-service still holds unacknowledged,
// expire intents nobody completed, and send due outbound webhooks. Every job walks the organizations one at a time
// under that organization's RLS context, a failing organization never stops the rest, and a job still running when
// its next tick fires skips that tick rather than overlapping itself.
@Injectable()
export class PaymentJobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentJobsService.name);
  private readonly options: PaymentJobsOptions;
  private readonly timers: NodeJS.Timeout[] = [];
  private readonly running = new Set<JobName>();

  constructor(
    private readonly organizationRepository: OrganizationDomainRepository,
    private readonly primaryDb: PrimaryDatabaseService,
    private readonly nats: ScopedNatsClientService,
    private readonly dispatcher: PaymentEventDispatcherService,
    private readonly deliveries: WebhookDeliveryDomainService,
    @Optional() @Inject(PAYMENT_JOBS_OPTIONS) options?: Partial<PaymentJobsOptions>,
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  onModuleInit(): void {
    if (!this.options.enabled) return;
    this.schedule('event-sweep', this.options.eventSweepMs, () => this.sweepPendingEvents());
    this.schedule('expire-sweep', this.options.expireSweepMs, () => this.expireStaleIntents());
    this.schedule('delivery-worker', this.options.deliveryWorkerMs, () => this.deliverWebhooks());
    this.logger.log('Payment background jobs started');
  }

  onModuleDestroy(): void {
    for (const timer of this.timers) clearInterval(timer);
    this.timers.length = 0;
  }

  // Dispatches every event payments-service has not had acknowledged
  sweepPendingEvents(): Promise<void> {
    return this.runExclusive('event-sweep', () =>
      this.forEachOrganization('event-sweep', true, async (orgId) => {
        const { events } = await this.nats.send<{ events: PaymentEventResponseDto[] }>(
          { orgId },
          'payments',
          'payments.events.pending',
          { limit: this.options.batchSize },
        );
        await this.dispatcher.dispatch(orgId, events);
      }),
    );
  }

  // Expires intents past their deadline and dispatches the expiry events that produces
  expireStaleIntents(): Promise<void> {
    return this.runExclusive('expire-sweep', () =>
      this.forEachOrganization('expire-sweep', true, async (orgId) => {
        const { events } = await this.nats.send<{ events: PaymentEventResponseDto[] }>(
          { orgId },
          'payments',
          'payments.intents.expireStale',
          { limit: this.options.batchSize },
        );
        await this.dispatcher.dispatch(orgId, events);
      }),
    );
  }

  // Sends each organization's due outbound webhooks
  deliverWebhooks(): Promise<void> {
    return this.runExclusive('delivery-worker', () =>
      this.forEachOrganization('delivery-worker', false, async (orgId) => {
        await this.deliveries.deliverDue(orgId);
      }),
    );
  }

  private schedule(name: JobName, intervalMs: number, job: () => Promise<void>): void {
    const timer = setInterval(() => {
      job().catch((error: unknown) => this.logger.error(`Payment job ${name} crashed: ${describe(error)}`));
    }, intervalMs);
    // A pending tick must not keep the process alive through shutdown
    timer.unref();
    this.timers.push(timer);
  }

  // Runs a job unless the previous run of the same job has not finished
  private async runExclusive(name: JobName, job: () => Promise<void>): Promise<void> {
    if (this.running.has(name)) {
      this.logger.debug(`Payment job ${name} still running — skipping this tick`);
      return;
    }
    this.running.add(name);
    try {
      await job();
    } finally {
      this.running.delete(name);
    }
  }

  // Runs the work once per organization under its RLS context. When payments-service is not deployed at all every
  // organization would fail the same way, so the first "no subscribers" answer ends the pass for this tick
  private async forEachOrganization(
    name: JobName,
    needsPaymentsService: boolean,
    work: (orgId: string) => Promise<void>,
  ): Promise<void> {
    const organizations = await this.organizationRepository.findAll();
    for (const organization of organizations) {
      try {
        await this.primaryDb.runWithRlsContext({ orgId: organization.id }, () => work(organization.id));
      } catch (error: unknown) {
        if (needsPaymentsService && isNoResponders(error)) {
          this.logger.debug(`Payment job ${name}: payments-service is not reachable — skipping this tick`);
          return;
        }
        this.logger.warn(`Payment job ${name} failed for org ${organization.id}: ${describe(error)}`);
      }
    }
  }
}

// The NATS client's answer when no service subscribes to the subject
function isNoResponders(error: unknown): boolean {
  const message = describe(error).toLowerCase();
  return message.includes('no subscribers') || message.includes('no responders');
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
}
