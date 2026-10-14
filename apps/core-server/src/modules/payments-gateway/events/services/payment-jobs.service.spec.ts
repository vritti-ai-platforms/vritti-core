import type { WebhookDeliveryDomainService } from '@domain/app-webhook/services/webhook-delivery.service';
import type { OrganizationDomainRepository } from '@domain/organization/repositories/organization.repository';
import { Logger } from '@nestjs/common';
import type { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { ScopedNatsClientService } from '@/services/scoped-nats-client.service';
import type { PaymentEventDispatcherService } from './payment-event-dispatcher.service';
import { PaymentJobsService } from './payment-jobs.service';

describe('PaymentJobsService', () => {
  const findAll = jest.fn();
  const runWithRlsContext = jest.fn();
  const send = jest.fn();
  const dispatch = jest.fn();
  const deliverDue = jest.fn();

  const build = (options: ConstructorParameters<typeof PaymentJobsService>[5] = { enabled: false }) =>
    new PaymentJobsService(
      { findAll } as unknown as OrganizationDomainRepository,
      { runWithRlsContext } as unknown as PrimaryDatabaseService,
      { send } as unknown as ScopedNatsClientService,
      { dispatch } as unknown as PaymentEventDispatcherService,
      { deliverDue } as unknown as WebhookDeliveryDomainService,
      options,
    );

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    runWithRlsContext.mockImplementation((_rls: unknown, fn: () => Promise<unknown>) => fn());
    findAll.mockResolvedValue([{ id: 'org-1' }, { id: 'org-2' }]);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('drains each organization pending events under its own RLS context and dispatches them', async () => {
    const events = [{ id: 'evt-1' }];
    send.mockResolvedValue({ events });

    await build().sweepPendingEvents();

    expect(runWithRlsContext).toHaveBeenCalledWith({ orgId: 'org-1' }, expect.any(Function));
    expect(runWithRlsContext).toHaveBeenCalledWith({ orgId: 'org-2' }, expect.any(Function));
    expect(send).toHaveBeenCalledWith({ orgId: 'org-1' }, 'payments', 'payments.events.pending', { limit: 100 });
    expect(dispatch).toHaveBeenCalledWith('org-1', events);
    expect(dispatch).toHaveBeenCalledWith('org-2', events);
  });

  it('expires stale intents and dispatches the expiry events', async () => {
    send.mockResolvedValue({ events: [{ id: 'evt-x' }] });

    await build().expireStaleIntents();

    expect(send).toHaveBeenCalledWith({ orgId: 'org-1' }, 'payments', 'payments.intents.expireStale', { limit: 100 });
    expect(dispatch).toHaveBeenCalledWith('org-1', [{ id: 'evt-x' }]);
  });

  it('keeps going when one organization fails', async () => {
    send.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({ events: [] });

    await build().sweepPendingEvents();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith('org-2', []);
  });

  it('ends the pass when payments-service has no subscribers at all', async () => {
    send.mockRejectedValue(new Error('Empty response. There are no subscribers listening to that message'));

    await build().sweepPendingEvents();

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('sends due webhooks for every organization', async () => {
    deliverDue.mockResolvedValue({ attempted: 0, delivered: 0, failed: 0 });

    await build().deliverWebhooks();

    expect(deliverDue).toHaveBeenCalledWith('org-1');
    expect(deliverDue).toHaveBeenCalledWith('org-2');
  });

  it('skips a tick while the previous run of the same job is still going', async () => {
    let release: () => void = () => undefined;
    deliverDue.mockImplementation(() => new Promise<void>((resolve) => (release = resolve)));
    const jobs = build();

    const first = jobs.deliverWebhooks();
    await jobs.deliverWebhooks();
    expect(findAll).toHaveBeenCalledTimes(1);

    release();
    await new Promise((resolve) => setImmediate(resolve));
    release();
    await first;
  });

  it('starts no timers when disabled and runs on the configured intervals when enabled', async () => {
    jest.useFakeTimers();
    send.mockResolvedValue({ events: [] });
    deliverDue.mockResolvedValue({ attempted: 0, delivered: 0, failed: 0 });

    const disabled = build({ enabled: false, eventSweepMs: 10, expireSweepMs: 10, deliveryWorkerMs: 10 });
    disabled.onModuleInit();
    await jest.advanceTimersByTimeAsync(50);
    expect(findAll).not.toHaveBeenCalled();

    const enabled = build({ enabled: true, eventSweepMs: 1000, expireSweepMs: 5000, deliveryWorkerMs: 500 });
    enabled.onModuleInit();
    await jest.advanceTimersByTimeAsync(1000);
    enabled.onModuleDestroy();

    expect(deliverDue).toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith(expect.anything(), 'payments', 'payments.events.pending', expect.anything());
    expect(send).not.toHaveBeenCalledWith(
      expect.anything(),
      'payments',
      'payments.intents.expireStale',
      expect.anything(),
    );
  });
});
