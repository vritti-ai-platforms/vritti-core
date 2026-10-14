import type { GatewayRegistry } from '@domain/gateways/gateway-registry';
import type { NormalizedWebhookEvent, PaymentGatewayTransport } from '@domain/gateways/gateway-transport';
import type { PaymentTransfersDomainService } from '@domain/payment-transfers/services/payment-transfers.service';
import type { WebhookEventsDomainService } from '@domain/webhook-events/services/webhook-events.service';
import { ServiceUnavailableException, UnauthorizedException } from '@vritti/api-sdk/exceptions';
import type { PaymentLifecycleService } from '@/modules/payment-lifecycle/services/payment-lifecycle.service';
import { WebhooksService } from './webhooks.service';

// The real service pulls in the money helpers (ESM-only dinero); the orchestration under test only needs its shape
jest.mock('@domain/payment-transfers/services/payment-transfers.service', () => ({
  PaymentTransfersDomainService: class {},
}));
jest.mock('@/modules/payment-lifecycle/services/payment-lifecycle.service', () => ({
  PaymentLifecycleService: class {},
}));

const dto = {
  organizationId: 'org-1',
  configId: 'pgc-1',
  gatewayCode: 'razorpay',
  webhookSecret: 'whsec',
  rawBody: '{}',
  headers: {},
};

const event = (overrides: Partial<NormalizedWebhookEvent> = {}): NormalizedWebhookEvent => ({
  dedupeKey: 'hash-1',
  providerEventId: 'evt_1',
  eventType: 'transfer.processed',
  payment: null,
  transfer: {
    providerTransferId: 'trf_1',
    providerAccountId: 'acc_1',
    providerPaymentId: 'pay_1',
    amount: 70000n,
    status: 'PROCESSED',
    errorCode: null,
    errorDescription: null,
    raw: {},
  },
  providerOrderId: null,
  raw: {},
  ...overrides,
});

describe('WebhooksService', () => {
  const verifyWebhook = jest.fn();
  const parseWebhook = jest.fn();
  const transport = { verifyWebhook, parseWebhook } as unknown as PaymentGatewayTransport;
  const registry = { resolve: () => transport } as unknown as GatewayRegistry;
  const record = jest.fn();
  const markProcessed = jest.fn();
  const markIgnored = jest.fn();
  const markFailed = jest.fn();
  const events = { record, markProcessed, markIgnored, markFailed } as unknown as WebhookEventsDomainService;
  const applyTransferEvent = jest.fn();
  const transfers = { applyTransferEvent } as unknown as PaymentTransfersDomainService;
  const applyWebhookPayment = jest.fn();
  const lifecycle = { applyWebhookPayment } as unknown as PaymentLifecycleService;
  const service = new WebhooksService(registry, events, transfers, lifecycle);

  beforeEach(() => {
    jest.resetAllMocks();
    verifyWebhook.mockReturnValue(true);
  });

  it('rejects a delivery when no webhook secret is configured', async () => {
    await expect(service.ingest({ ...dto, webhookSecret: null })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a delivery whose signature does not verify', async () => {
    verifyWebhook.mockReturnValue(false);
    await expect(service.ingest(dto)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(record).not.toHaveBeenCalled();
  });

  it('applies a first transfer event to its transfer and marks the event processed', async () => {
    parseWebhook.mockReturnValue([event()]);
    record.mockResolvedValue([{ id: 'we-1', inserted: true, status: 'RECEIVED' }]);
    applyTransferEvent.mockResolvedValue({ outcome: 'applied', transfer: { id: 'pt-1' } });

    const result = await service.ingest(dto);

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ events: [expect.objectContaining({ dedupeKey: 'hash-1' })] }),
    );
    expect(applyTransferEvent).toHaveBeenCalledWith(expect.objectContaining({ providerTransferId: 'trf_1' }));
    expect(markProcessed).toHaveBeenCalledWith('we-1');
    expect(result).toEqual({ accepted: true, duplicate: false, eventIds: ['we-1'], paymentEvents: [] });
  });

  it('ignores a transfer this platform never created', async () => {
    parseWebhook.mockReturnValue([event()]);
    record.mockResolvedValue([{ id: 'we-1', inserted: true, status: 'RECEIVED' }]);
    applyTransferEvent.mockResolvedValue({ outcome: 'unknown' });

    await service.ingest(dto);

    expect(markIgnored).toHaveBeenCalledWith('we-1', expect.any(String));
    expect(markProcessed).not.toHaveBeenCalled();
  });

  it('marks processed a transfer event that arrived behind a later status, without failing', async () => {
    parseWebhook.mockReturnValue([event()]);
    record.mockResolvedValue([{ id: 'we-1', inserted: true, status: 'RECEIVED' }]);
    applyTransferEvent.mockResolvedValue({ outcome: 'stale', transfer: { id: 'pt-1', status: 'PROCESSED' } });

    await service.ingest(dto);

    expect(markProcessed).toHaveBeenCalledWith('we-1');
    expect(markFailed).not.toHaveBeenCalled();
  });

  it('asks for a redelivery when the transfer it names is still being sent', async () => {
    parseWebhook.mockReturnValue([event()]);
    record.mockResolvedValue([{ id: 'we-1', inserted: true, status: 'RECEIVED' }]);
    applyTransferEvent.mockResolvedValue({ outcome: 'in_flight' });

    await expect(service.ingest(dto)).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(markFailed).toHaveBeenCalledWith('we-1', expect.any(String));
    expect(markIgnored).not.toHaveBeenCalled();
    expect(markProcessed).not.toHaveBeenCalled();
  });

  it('records a failed transfer update on the event and refuses the delivery so the gateway retries', async () => {
    parseWebhook.mockReturnValue([event()]);
    record.mockResolvedValue([{ id: 'we-1', inserted: true, status: 'RECEIVED' }]);
    applyTransferEvent.mockRejectedValue(new Error('db down'));

    const error = await service.ingest(dto).catch((caught: unknown) => caught);

    expect(markFailed).toHaveBeenCalledWith('we-1', 'db down');
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getResponse()).toMatchObject({ label: 'Webhook Processing Failed' });
  });

  it('still refuses the delivery when the failure cannot be recorded', async () => {
    parseWebhook.mockReturnValue([event()]);
    record.mockResolvedValue([{ id: 'we-1', inserted: true, status: 'RECEIVED' }]);
    applyTransferEvent.mockRejectedValue(new Error('db down'));
    markFailed.mockRejectedValue(new Error('still down'));

    await expect(service.ingest(dto)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it.each(['PROCESSED', 'IGNORED'])('does not act on a repeat delivery already %s', async (status) => {
    parseWebhook.mockReturnValue([event()]);
    record.mockResolvedValue([{ id: 'we-1', inserted: false, status }]);

    const result = await service.ingest(dto);

    expect(applyTransferEvent).not.toHaveBeenCalled();
    expect(result.duplicate).toBe(true);
  });

  it.each(['RECEIVED', 'FAILED'])('acts again on a repeat delivery still %s', async (status) => {
    parseWebhook.mockReturnValue([event()]);
    record.mockResolvedValue([{ id: 'we-1', inserted: false, status }]);
    applyTransferEvent.mockResolvedValue({ outcome: 'applied', transfer: { id: 'pt-1' } });

    const result = await service.ingest(dto);

    expect(applyTransferEvent).toHaveBeenCalledTimes(1);
    expect(markProcessed).toHaveBeenCalledWith('we-1');
    expect(result.duplicate).toBe(true);
  });

  const paymentEvent = () =>
    event({
      eventType: 'payment.captured',
      transfer: null,
      providerOrderId: 'order_1',
      payment: {
        providerPaymentId: 'pay_1',
        providerOrderId: 'order_1',
        status: 'captured',
        amount: 50000n,
        currency: 'INR',
        method: 'upi',
        fee: null,
        tax: null,
        errorCode: null,
        errorDescription: null,
        raw: {},
      },
    });

  it('advances the intent a payment belongs to and returns the events it caused', async () => {
    parseWebhook.mockReturnValue([paymentEvent()]);
    record.mockResolvedValue([{ id: 'we-1', inserted: true, status: 'RECEIVED' }]);
    const succeeded = { id: 'pe-1', intentId: 'pi-1', type: 'payment_intent.succeeded', payload: {}, createdAt: '' };
    applyWebhookPayment.mockResolvedValue({ intent: { id: 'pi-1' }, events: [succeeded] });

    const result = await service.ingest(dto);

    expect(applyWebhookPayment).toHaveBeenCalledWith(expect.objectContaining({ providerOrderId: 'order_1' }));
    expect(markProcessed).toHaveBeenCalledWith('we-1');
    expect(result.paymentEvents).toEqual([succeeded]);
  });

  it('ignores a payment for an order no intent owns', async () => {
    parseWebhook.mockReturnValue([paymentEvent()]);
    record.mockResolvedValue([{ id: 'we-1', inserted: true, status: 'RECEIVED' }]);
    applyWebhookPayment.mockResolvedValue(null);

    const result = await service.ingest(dto);

    expect(markIgnored).toHaveBeenCalledWith('we-1', expect.any(String));
    expect(result.paymentEvents).toEqual([]);
  });
});
