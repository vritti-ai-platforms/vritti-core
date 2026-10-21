import type { GatewayRegistry } from '@domain/gateways/gateway-registry';
import type { NormalizedPayment } from '@domain/gateways/gateway-transport';
import type { PaymentAttemptsDomainRepository } from '@domain/payment-attempts/repositories/payment-attempts.repository';
import type { PaymentEventsDomainRepository } from '@domain/payment-events/repositories/payment-events.repository';
import type { PaymentIntentsDomainRepository } from '@domain/payment-intents/repositories/payment-intents.repository';
import type { PaymentTransfersDomainRepository } from '@domain/payment-transfers/repositories/payment-transfers.repository';
import type { PaymentTransfersDomainService } from '@domain/payment-transfers/services/payment-transfers.service';
import type { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException, ConflictException } from '@vritti/api-sdk/exceptions';
import type { PaymentIntent } from '@/db/schema';
import type { CreatePaymentIntentDto } from '../dto/payment-intent-requests.dto';
import { PaymentLifecycleService } from './payment-lifecycle.service';

// The real money module pulls in ESM-only dinero; the lifecycle only needs a minor-unit round trip
jest.mock('@vritti/api-sdk/money', () => ({
  CurrencyAmountDto: { from: (minor: bigint, currency: string) => ({ currency, value: String(minor) }) },
}));
jest.mock('@domain/payment-transfers/services/payment-transfers.service', () => ({
  PaymentTransfersDomainService: class {},
}));

const CREDENTIALS = { key_id: 'rzp_test_abc', key_secret: 'secret' };

const intent = (overrides: Partial<PaymentIntent> = {}): PaymentIntent => ({
  id: 'pi-1',
  organizationId: 'org-1',
  legalEntityId: 'le-1',
  siteId: 'site-1',
  appId: 'app-1',
  partyId: 'party-1',
  configId: 'pgc-1',
  gatewayCode: 'razorpay',
  bankAccountId: 'ba-1',
  type: 'APP',
  referenceType: 'commerce.order',
  referenceId: 'ORD-1001',
  description: null,
  idempotencyKey: 'ORD-1001:1',
  receipt: 'ORD-1001',
  amount: 50000n,
  currency: 'INR',
  status: 'REQUIRES_ACTION',
  providerOrderId: 'order_1',
  providerPaymentId: null,
  checkout: { gateway: 'razorpay', order_id: 'order_1' },
  method: null,
  fee: null,
  tax: null,
  customer: null,
  metadata: null,
  returnUrl: null,
  checkoutUrl: null,
  failureCode: null,
  failureMessage: null,
  succeededAt: null,
  expiresAt: new Date(Date.now() + 60_000),
  createdAt: new Date('2026-10-09T10:00:00Z'),
  updatedAt: new Date('2026-10-09T10:00:00Z'),
  ...overrides,
});

const payment = (overrides: Partial<NormalizedPayment> = {}): NormalizedPayment => ({
  providerPaymentId: 'pay_1',
  providerOrderId: 'order_1',
  status: 'captured',
  amount: 50000n,
  currency: 'INR',
  method: 'upi',
  fee: 1000n,
  tax: 180n,
  errorCode: null,
  errorDescription: null,
  raw: {},
  ...overrides,
});

const createDto: CreatePaymentIntentDto = {
  legalEntityId: 'le-1',
  siteId: 'site-1',
  appId: 'app-1',
  partyId: 'party-1',
  configId: 'pgc-1',
  gatewayCode: 'razorpay',
  bankAccountId: 'ba-1',
  type: 'APP',
  credentials: CREDENTIALS,
  amount: '50000',
  currency: 'INR',
  referenceType: 'commerce.order',
  referenceId: 'ORD-1001',
  idempotencyKey: 'ORD-1001:1',
};

describe('PaymentLifecycleService', () => {
  const transport = {
    createOrder: jest.fn(),
    verifyCheckoutSignature: jest.fn(),
    fetchPayment: jest.fn(),
  };
  const split = { createTransfers: jest.fn() };
  const registry = {
    resolve: () => transport,
    resolveSplit: () => split,
  } as unknown as GatewayRegistry;
  const runInTransaction = jest.fn();
  const database = { runInTransaction } as unknown as PrimaryDatabaseService;
  const intents = {
    findByIdempotencyKey: jest.fn(),
    findByProviderOrderId: jest.fn(),
    findById: jest.fn(),
    lockById: jest.fn(),
    findExpirable: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const attempts = { upsertByProviderPayment: jest.fn() };
  const events = { create: jest.fn() };
  const transfers = { findUnsentByIntent: jest.fn() };
  const transfersService = { createForIntent: jest.fn(), markCreated: jest.fn() };
  const service = new PaymentLifecycleService(
    database,
    registry,
    intents as unknown as PaymentIntentsDomainRepository,
    attempts as unknown as PaymentAttemptsDomainRepository,
    events as unknown as PaymentEventsDomainRepository,
    transfers as unknown as PaymentTransfersDomainRepository,
    transfersService as unknown as PaymentTransfersDomainService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    runInTransaction.mockImplementation(<T>(fn: () => Promise<T>) => fn());
    transfers.findUnsentByIntent.mockResolvedValue([]);
    // An update answers with the row as it now stands
    intents.update.mockImplementation(async (_id: string, data: Partial<PaymentIntent>) => ({
      ...(intents.lockById.mock.results[0]?.value ? await intents.lockById.mock.results[0].value : intent()),
      ...data,
    }));
    events.create.mockImplementation(async (data: { type: string; payload: Record<string, unknown> }) => ({
      id: 'pe-1',
      intentId: 'pi-1',
      createdAt: new Date('2026-10-09T10:05:00Z'),
      ...data,
    }));
  });

  describe('create', () => {
    it('saves the intent before opening the gateway order, then stores the checkout', async () => {
      intents.findByIdempotencyKey.mockResolvedValue(undefined);
      intents.create.mockResolvedValue(intent({ status: 'CREATED', providerOrderId: null, checkout: null }));
      transport.createOrder.mockResolvedValue({
        providerOrderId: 'order_1',
        checkout: { key_id: 'rzp', order_id: 'order_1' },
      });

      const result = await service.create(createDto);

      expect(intents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50000n,
          receipt: 'ORD-1001',
          status: 'CREATED',
          referenceType: 'commerce.order',
        }),
      );
      expect(intents.create.mock.invocationCallOrder[0]).toBeLessThan(
        transport.createOrder.mock.invocationCallOrder[0],
      );
      expect(intents.update).toHaveBeenCalledWith('pi-1', {
        providerOrderId: 'order_1',
        checkout: { gateway: 'razorpay', key_id: 'rzp', order_id: 'order_1' },
        status: 'REQUIRES_ACTION',
      });
      expect(result.reference).toEqual({ type: 'commerce.order', id: 'ORD-1001' });
    });

    it('sends the split legs with the gateway order and stamps the transfers it created', async () => {
      const leg = {
        id: 'pt-1',
        providerAccountId: 'acc_seller',
        amount: 49250n,
        currency: 'INR',
        onHold: false,
        onHoldUntil: null,
      };
      intents.findByIdempotencyKey.mockResolvedValue(undefined);
      intents.create.mockResolvedValue(intent({ status: 'CREATED', providerOrderId: null, checkout: null }));
      transfers.findUnsentByIntent.mockResolvedValue([leg]);
      transport.createOrder.mockResolvedValue({
        providerOrderId: 'order_1',
        checkout: {},
        transfers: [
          { providerTransferId: 'trf_1', providerAccountId: 'acc_seller', amount: 49250n, status: 'CREATED' },
        ],
      });

      await service.create(createDto);

      expect(transport.createOrder).toHaveBeenCalledWith(
        createDto.credentials,
        expect.objectContaining({
          transfers: [
            expect.objectContaining({
              providerAccountId: 'acc_seller',
              amount: 49250n,
              currency: 'INR',
              onHold: false,
            }),
          ],
        }),
      );
      expect(transfersService.markCreated).toHaveBeenCalledWith('pt-1', 'trf_1', 'CREATED');
    });

    it('returns the intent already opened under the same key without calling the gateway', async () => {
      intents.findByIdempotencyKey.mockResolvedValue(intent());

      const result = await service.create(createDto);

      expect(transport.createOrder).not.toHaveBeenCalled();
      expect(intents.create).not.toHaveBeenCalled();
      expect(result.id).toBe('pi-1');
    });

    it('resumes an intent whose gateway order failed earlier instead of opening a second one', async () => {
      intents.findByIdempotencyKey.mockResolvedValue(intent({ status: 'CREATED', providerOrderId: null }));
      transport.createOrder.mockResolvedValue({ providerOrderId: 'order_2', checkout: {} });

      await service.create(createDto);

      expect(intents.create).not.toHaveBeenCalled();
      expect(transport.createOrder).toHaveBeenCalledTimes(1);
    });

    it('continues with the intent a concurrent create opened when the insert hits the key constraint', async () => {
      const conflict = Object.assign(new Error('Failed query'), {
        cause: { code: '23505', constraint: 'uq_payment_intents_org_idempotency_key' },
      });
      intents.findByIdempotencyKey
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(intent({ status: 'CREATED', providerOrderId: null }));
      intents.create.mockRejectedValue(conflict);
      transport.createOrder.mockResolvedValue({ providerOrderId: 'order_1', checkout: {} });

      const result = await service.create(createDto);

      expect(intents.findByIdempotencyKey).toHaveBeenCalledTimes(2);
      expect(transport.createOrder).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('pi-1');
    });

    it('returns the concurrently opened intent as is once it has its gateway order', async () => {
      const conflict = Object.assign(new Error('Failed query'), {
        cause: { code: '23505', constraint: 'uq_payment_intents_org_idempotency_key' },
      });
      intents.findByIdempotencyKey.mockResolvedValueOnce(undefined).mockResolvedValueOnce(intent());
      intents.create.mockRejectedValue(conflict);

      const result = await service.create(createDto);

      expect(transport.createOrder).not.toHaveBeenCalled();
      expect(result.id).toBe('pi-1');
    });

    it('rethrows an insert failure that is not the key constraint', async () => {
      const other = Object.assign(new Error('Failed query'), { cause: { code: '23503', constraint: 'fk_x' } });
      intents.findByIdempotencyKey.mockResolvedValue(undefined);
      intents.create.mockRejectedValue(other);

      await expect(service.create(createDto)).rejects.toBe(other);
      expect(intents.findByIdempotencyKey).toHaveBeenCalledTimes(1);
    });

    it.each(['CANCELED', 'EXPIRED', 'FAILED'] as const)('refuses to resume an intent that is %s', async (status) => {
      intents.findByIdempotencyKey.mockResolvedValue(intent({ status, providerOrderId: null }));

      const error = await service.create(createDto).catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({ label: 'Payment Ended' });
      expect(transport.createOrder).not.toHaveBeenCalled();
    });

    it('stores the return and checkout urls on a new intent', async () => {
      intents.findByIdempotencyKey.mockResolvedValue(undefined);
      intents.create.mockResolvedValue(intent({ status: 'CREATED', providerOrderId: null, checkout: null }));
      transport.createOrder.mockResolvedValue({ providerOrderId: 'order_1', checkout: {} });

      await service.create({
        ...createDto,
        returnUrl: 'https://shop.example/thanks',
        checkoutUrl: 'https://shop.example/checkout?retry=k1',
      });

      expect(intents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          returnUrl: 'https://shop.example/thanks',
          checkoutUrl: 'https://shop.example/checkout?retry=k1',
        }),
      );
    });

    it('moves the urls of a reused intent to the latest ones without treating them as a conflict', async () => {
      const stored = intent({ returnUrl: 'https://shop.example/old', checkoutUrl: 'https://shop.example/checkout' });
      intents.findByIdempotencyKey.mockResolvedValue(stored);
      intents.update.mockImplementation(async (_id: string, data: Partial<PaymentIntent>) => ({ ...stored, ...data }));

      const result = await service.create({ ...createDto, returnUrl: 'https://shop.example/new' });

      expect(intents.update).toHaveBeenCalledWith('pi-1', { returnUrl: 'https://shop.example/new' });
      expect(result.returnUrl).toBe('https://shop.example/new');
      expect(result.checkoutUrl).toBe('https://shop.example/checkout');
      expect(transport.createOrder).not.toHaveBeenCalled();
    });

    it('leaves a reused intent untouched when its urls are unchanged', async () => {
      intents.findByIdempotencyKey.mockResolvedValue(intent({ returnUrl: 'https://shop.example/thanks' }));

      await service.create({ ...createDto, returnUrl: 'https://shop.example/thanks' });

      expect(intents.update).not.toHaveBeenCalled();
    });

    it('refuses a key reused for a different amount', async () => {
      intents.findByIdempotencyKey.mockResolvedValue(intent({ amount: 99900n }));

      await expect(service.create(createDto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses split transfers that add up to more than the payment', async () => {
      intents.findByIdempotencyKey.mockResolvedValue(undefined);

      await expect(
        service.create({
          ...createDto,
          transfers: [{ linkedAccountId: 'la-1', providerAccountId: 'acc_1', amount: '60000' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(intents.create).not.toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    const confirmDto = {
      paymentIntentId: 'pi-1',
      credentials: CREDENTIALS,
      gatewayResponse: { orderId: 'order_1', paymentId: 'pay_1', signature: 'sig' },
    };

    it('refuses a response whose signature does not verify', async () => {
      intents.findById.mockResolvedValue(intent());
      transport.verifyCheckoutSignature.mockReturnValue(false);

      await expect(service.confirm(confirmDto)).rejects.toBeInstanceOf(BadRequestException);
      expect(transport.fetchPayment).not.toHaveBeenCalled();
    });

    it('refuses a response for another order', async () => {
      intents.findById.mockResolvedValue(intent());

      await expect(
        service.confirm({ ...confirmDto, gatewayResponse: { ...confirmDto.gatewayResponse, orderId: 'order_x' } }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses a payment whose amount differs from the intent', async () => {
      intents.findById.mockResolvedValue(intent());
      transport.verifyCheckoutSignature.mockReturnValue(true);
      transport.fetchPayment.mockResolvedValue(payment({ amount: 100n }));

      await expect(service.confirm(confirmDto)).rejects.toBeInstanceOf(BadRequestException);
      expect(intents.update).not.toHaveBeenCalled();
    });

    it('completes a captured payment once, with its event', async () => {
      intents.findById.mockResolvedValue(intent());
      intents.lockById.mockResolvedValue(intent());
      transport.verifyCheckoutSignature.mockReturnValue(true);
      transport.fetchPayment.mockResolvedValue(payment());

      const result = await service.confirm(confirmDto);

      expect(attempts.upsertByProviderPayment).toHaveBeenCalledWith(
        expect.objectContaining({ providerPaymentId: 'pay_1', status: 'CAPTURED' }),
      );
      expect(intents.update).toHaveBeenCalledWith(
        'pi-1',
        expect.objectContaining({ status: 'SUCCEEDED', providerPaymentId: 'pay_1', method: 'upi' }),
      );
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toMatchObject({
        type: 'payment_intent.succeeded',
        payload: expect.objectContaining({ reference: { type: 'commerce.order', id: 'ORD-1001' }, late: false }),
      });
    });

    it('returns an intent that already succeeded without acting again', async () => {
      intents.findById.mockResolvedValue(intent({ status: 'SUCCEEDED' }));

      const result = await service.confirm(confirmDto);

      expect(result.events).toEqual([]);
      expect(transport.fetchPayment).not.toHaveBeenCalled();
    });
  });

  describe('applyWebhookPayment', () => {
    it('ignores an order no intent owns', async () => {
      intents.findByProviderOrderId.mockResolvedValue(undefined);

      const result = await service.applyWebhookPayment({
        dedupeKey: 'h',
        providerEventId: 'e',
        eventType: 'payment.captured',
        payment: payment(),
        transfer: null,
        providerOrderId: 'order_1',
        raw: {},
      });

      expect(result).toBeNull();
    });

    it('records a payment that lands after the intent expired as a late success', async () => {
      intents.findByProviderOrderId.mockResolvedValue(intent({ status: 'EXPIRED' }));
      intents.lockById.mockResolvedValue(intent({ status: 'EXPIRED' }));

      const result = await service.applyWebhookPayment({
        dedupeKey: 'h',
        providerEventId: 'e',
        eventType: 'payment.captured',
        payment: payment(),
        transfer: null,
        providerOrderId: 'order_1',
        raw: {},
      });

      expect(result?.events[0].payload).toMatchObject({ late: true });
    });

    it('records a failed payment while the intent stays payable', async () => {
      intents.findByProviderOrderId.mockResolvedValue(intent());
      intents.lockById.mockResolvedValue(intent());

      const result = await service.applyWebhookPayment({
        dedupeKey: 'h',
        providerEventId: 'e',
        eventType: 'payment.failed',
        payment: payment({ status: 'failed', errorCode: 'BAD_REQUEST_ERROR', errorDescription: 'Card declined' }),
        transfer: null,
        providerOrderId: 'order_1',
        raw: {},
      });

      expect(intents.update).toHaveBeenCalledWith('pi-1', {
        failureCode: 'BAD_REQUEST_ERROR',
        failureMessage: 'Card declined',
      });
      expect(result?.events[0].type).toBe('payment_intent.payment_failed');
    });

    const failedEvent = () => ({
      dedupeKey: 'h',
      providerEventId: 'e',
      eventType: 'payment.failed',
      payment: payment({ status: 'failed', errorCode: 'BAD_REQUEST_ERROR', errorDescription: 'Declined' }),
      transfer: null,
      providerOrderId: 'order_1',
      raw: {},
    });

    it('hands a processing intent back to the customer when its payment fails', async () => {
      const processing = intent({ status: 'PROCESSING', providerPaymentId: 'pay_1' });
      intents.findByProviderOrderId.mockResolvedValue(processing);
      intents.lockById.mockResolvedValue(processing);

      const result = await service.applyWebhookPayment(failedEvent());

      expect(intents.update).toHaveBeenCalledWith('pi-1', {
        failureCode: 'BAD_REQUEST_ERROR',
        failureMessage: 'Declined',
        status: 'REQUIRES_ACTION',
        providerPaymentId: null,
      });
      expect(result?.intent.status).toBe('REQUIRES_ACTION');
      expect(result?.events[0].type).toBe('payment_intent.payment_failed');
    });

    it('keeps an intent processing when a different payment than the one it waits on fails', async () => {
      const processing = intent({ status: 'PROCESSING', providerPaymentId: 'pay_other' });
      intents.findByProviderOrderId.mockResolvedValue(processing);
      intents.lockById.mockResolvedValue(processing);

      await service.applyWebhookPayment(failedEvent());

      expect(intents.update).toHaveBeenCalledWith('pi-1', {
        failureCode: 'BAD_REQUEST_ERROR',
        failureMessage: 'Declined',
      });
    });

    it.each([
      'CANCELED',
      'EXPIRED',
    ] as const)('raises no event for a failure on an intent already %s', async (status) => {
      intents.findByProviderOrderId.mockResolvedValue(intent({ status }));
      intents.lockById.mockResolvedValue(intent({ status }));

      const result = await service.applyWebhookPayment(failedEvent());

      expect(attempts.upsertByProviderPayment).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED' }));
      expect(intents.update).not.toHaveBeenCalled();
      expect(events.create).not.toHaveBeenCalled();
      expect(result?.events).toEqual([]);
    });

    it('names the webhook payment, not the browser response, when the amount does not match', async () => {
      intents.findByProviderOrderId.mockResolvedValue(intent());

      const error = await service
        .applyWebhookPayment({ ...failedEvent(), payment: payment({ amount: 1n }) })
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        errors: [expect.objectContaining({ field: 'payment' })],
      });
    });
  });

  describe('cancel', () => {
    it('cancels an intent still waiting on the customer and records its event', async () => {
      intents.lockById.mockResolvedValue(intent());

      const result = await service.cancel('pi-1');

      expect(runInTransaction).toHaveBeenCalledTimes(1);
      expect(intents.update).toHaveBeenCalledWith('pi-1', { status: 'CANCELED' });
      expect(events.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'payment_intent.canceled' }));
      expect(result.intent.status).toBe('CANCELED');
      expect(result.events).toHaveLength(1);
      expect(result.events[0].type).toBe('payment_intent.canceled');
    });

    it('returns an intent already cancelled with no new event', async () => {
      intents.lockById.mockResolvedValue(intent({ status: 'CANCELED' }));

      const result = await service.cancel('pi-1');

      expect(intents.update).not.toHaveBeenCalled();
      expect(events.create).not.toHaveBeenCalled();
      expect(result).toEqual({ intent: expect.objectContaining({ status: 'CANCELED' }), events: [] });
    });

    it('refuses to cancel a paid intent', async () => {
      intents.lockById.mockResolvedValue(intent({ status: 'SUCCEEDED' }));

      await expect(service.cancel('pi-1')).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('expireStale', () => {
    it('expires an overdue intent with its event, and skips one paid since the scan', async () => {
      const overdue = { expiresAt: new Date(Date.now() - 1000) };
      intents.findExpirable.mockResolvedValue([intent({ id: 'pi-1', ...overdue }), intent({ id: 'pi-2', ...overdue })]);
      intents.lockById
        .mockResolvedValueOnce(intent({ id: 'pi-1', ...overdue }))
        .mockResolvedValueOnce(intent({ id: 'pi-2', status: 'SUCCEEDED', ...overdue }));

      const expired = await service.expireStale();

      expect(intents.update).toHaveBeenCalledTimes(1);
      expect(intents.update).toHaveBeenCalledWith('pi-1', { status: 'EXPIRED' });
      expect(expired).toHaveLength(1);
      expect(expired[0].type).toBe('payment_intent.expired');
    });
  });

  describe('executeTransfers', () => {
    const leg = {
      id: 'pt-1',
      linkedAccountId: 'la-1',
      providerAccountId: 'acc_1',
      amount: 30000n,
      currency: 'INR',
      onHold: false,
      onHoldUntil: null,
      providerTransferId: null,
    };

    it('refuses an intent that has not succeeded', async () => {
      intents.lockById.mockResolvedValue(intent());

      await expect(
        service.executeTransfers({ paymentIntentId: 'pi-1', credentials: CREDENTIALS }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(transfers.findUnsentByIntent).not.toHaveBeenCalled();
    });

    it('locks the intent, sends the unsent legs and stamps each in the same transaction', async () => {
      intents.lockById.mockResolvedValue(intent({ status: 'SUCCEEDED', providerPaymentId: 'pay_1' }));
      transfers.findUnsentByIntent.mockResolvedValue([leg]);
      split.createTransfers.mockResolvedValue([
        { providerTransferId: 'trf_1', providerAccountId: 'acc_1', amount: 30000n, status: 'PENDING' },
      ]);
      transfersService.markCreated.mockResolvedValue({ id: 'pt-1' });

      const sent = await service.executeTransfers({ paymentIntentId: 'pi-1', credentials: CREDENTIALS });

      expect(runInTransaction).toHaveBeenCalledTimes(1);
      expect(intents.lockById.mock.invocationCallOrder[0]).toBeLessThan(
        transfers.findUnsentByIntent.mock.invocationCallOrder[0],
      );
      expect(split.createTransfers).toHaveBeenCalledWith(CREDENTIALS, 'pay_1', [
        expect.objectContaining({ providerAccountId: 'acc_1', amount: 30000n }),
      ]);
      expect(transfersService.markCreated).toHaveBeenCalledWith('pt-1', 'trf_1', 'PENDING');
      expect(sent).toHaveLength(1);
    });

    it('sends nothing when every leg already carries a gateway transfer id', async () => {
      intents.lockById.mockResolvedValue(intent({ status: 'SUCCEEDED', providerPaymentId: 'pay_1' }));
      transfers.findUnsentByIntent.mockResolvedValue([]);

      const sent = await service.executeTransfers({ paymentIntentId: 'pi-1', credentials: CREDENTIALS });

      expect(split.createTransfers).not.toHaveBeenCalled();
      expect(sent).toEqual([]);
    });

    it('sends each leg once when two calls race, since the second reads the legs only after the first commits', async () => {
      // A transaction holding the intent's row lock runs to its end before the next one gets the row
      let queue: Promise<unknown> = Promise.resolve();
      runInTransaction.mockImplementation(<T>(fn: () => Promise<T>) => {
        const run = queue.then(fn);
        queue = run.catch(() => undefined);
        return run;
      });
      let stampedId: string | null = null;
      intents.lockById.mockResolvedValue(intent({ status: 'SUCCEEDED', providerPaymentId: 'pay_1' }));
      transfers.findUnsentByIntent.mockImplementation(async () => (stampedId ? [] : [leg]));
      split.createTransfers.mockResolvedValue([
        { providerTransferId: 'trf_1', providerAccountId: 'acc_1', amount: 30000n, status: 'CREATED' },
      ]);
      transfersService.markCreated.mockImplementation(async (_id: string, providerTransferId: string) => {
        stampedId = providerTransferId;
        return { id: 'pt-1' };
      });

      const [first, second] = await Promise.all([
        service.executeTransfers({ paymentIntentId: 'pi-1', credentials: CREDENTIALS }),
        service.executeTransfers({ paymentIntentId: 'pi-1', credentials: CREDENTIALS }),
      ]);

      expect(split.createTransfers).toHaveBeenCalledTimes(1);
      expect(first).toHaveLength(1);
      expect(second).toEqual([]);
    });
  });
});
