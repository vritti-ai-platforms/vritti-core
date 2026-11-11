import { WebhookDeliveryDomainService } from '@domain/app-webhook/services/webhook-delivery.service';
import { OrganizationDomainRepository } from '@domain/organization/repositories/organization.repository';
import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit, Optional } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { ScopedNatsClientService } from '@/services/scoped-nats-client.service';
import type { PaymentEventResponseDto } from '../../intents/dto/response/payment-event-response.dto';
import type { PaymentIntentResponseDto } from '../../intents/dto/response/payment-intent-response.dto';
import { PaymentEventDispatcherService } from './payment-event-dispatcher.service';

export const PAYMENT_JOBS_OPTIONS = Symbol('PAYMENT_JOBS_OPTIONS');

export interface PaymentJobsOptions {
  enabled: boolean;
  eventSweepMs: number;
  expireSweepMs: number;
  deliveryWorkerMs: number;
  checkoutExpiryMs: number;
  refundSyncMs: number;
  batchSize: number;
}

const DEFAULT_OPTIONS: PaymentJobsOptions = {
  // Unit and e2e test processes boot no timers unless a test opts in
  enabled: process.env.NODE_ENV !== 'test',
  eventSweepMs: 60_000,
  expireSweepMs: 5 * 60_000,
  deliveryWorkerMs: 30_000,
  checkoutExpiryMs: 5 * 60_000,
  refundSyncMs: 10 * 60_000,
  batchSize: 100,
};

type JobName = 'event-sweep' | 'expire-sweep' | 'delivery-worker' | 'checkout-expiry' | 'refund-sync';

// The payments safety nets, run in-process on timers: drain events payments-service still holds unacknowledged, expire
// intents nobody completed, and send due outbound webhooks.
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
    private readonly gatewayConfigService: PaymentGatewayConfigDomainService,
    @Optional() @Inject(PAYMENT_JOBS_OPTIONS) options?: Partial<PaymentJobsOptions>,
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  onModuleInit(): void {
    if (!this.options.enabled) return;
    this.schedule('event-sweep', this.options.eventSweepMs, () => this.sweepPendingEvents());
    this.schedule('expire-sweep', this.options.expireSweepMs, () => this.expireStaleIntents());
    this.schedule('delivery-worker', this.options.deliveryWorkerMs, () => this.deliverWebhooks());
    this.schedule('checkout-expiry', this.options.checkoutExpiryMs, () => this.expireStaleCheckouts());
    this.schedule('refund-sync', this.options.refundSyncMs, () => this.syncPendingRefunds());
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

  // Cancels the open checkouts whose 30-minute window closed unpaid, whatever payments were opened for them
  expireStaleCheckouts(): Promise<void> {
    return this.runExclusive('checkout-expiry', () =>
      this.forEachOrganization('checkout-expiry', true, async (orgId) => {
        await this.nats.send({ orgId }, 'commerce', 'org.checkouts.expireStale', { limit: this.options.batchSize });
      }),
    );
  }

  // Asks the gateway after each refund it accepted but never confirmed (its webhook lost or not sent) and dispatches
  // the refunded / refund-failed events that produces
  syncPendingRefunds(): Promise<void> {
    return this.runExclusive('refund-sync', () =>
      this.forEachOrganization('refund-sync', true, async (orgId) => {
        const pending = await this.nats.send<PaymentIntentResponseDto[]>(
          { orgId },
          'payments',
          'payments.intents.listRefundPending',
          { limit: this.options.batchSize },
        );
        // One decryption per gateway config, however many of its refunds are pending
        const credentialsByConfig = new Map<string, Record<string, string>>();
        for (const intent of pending) {
          let credentials = credentialsByConfig.get(intent.configId);
          if (!credentials) {
            credentials = (await this.gatewayConfigService.getDecryptedCredentials(intent.configId)).credentials;
            credentialsByConfig.set(intent.configId, credentials);
          }
          const { events } = await this.nats.send<{ events: PaymentEventResponseDto[] }>(
            { orgId },
            'payments',
            'payments.intents.syncRefund',
            { paymentIntentId: intent.id, credentials },
          );
          await this.dispatcher.dispatch(orgId, events);
        }
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

  // Runs the work once per organization under its RLS context.
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
