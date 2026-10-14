import type { WebhookDeliveryDomainService } from '@domain/app-webhook/services/webhook-delivery.service';
import { Logger } from '@nestjs/common';
import type { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { ScopedNatsClientService } from '@/services/scoped-nats-client.service';
import type { PaymentEventResponseDto } from '../../intents/dto/response/payment-event-response.dto';
import type { PaymentEventHandler } from '../payment-event-handler';
import type { CommerceOrderPaymentHandlerService } from './commerce-order-payment-handler.service';
import { PaymentEventDispatcherService } from './payment-event-dispatcher.service';

const ORG = 'org-1';

function eventOf(id: string, referenceType: string, appId: string | null = 'app-1'): PaymentEventResponseDto {
  return {
    id,
    intentId: `pi-${id}`,
    type: 'payment_intent.succeeded',
    createdAt: '2026-10-09T11:50:00.000Z',
    payload: {
      paymentIntentId: `pi-${id}`,
      appId,
      partyId: null,
      legalEntityId: 'le-1',
      siteId: 'site-1',
      configId: 'cfg-1',
      reference: { type: referenceType, id: `ref-${id}` },
      amount: { currency: 'INR', value: '10.00' },
      method: 'upi',
      providerPaymentId: 'pay_1',
      paidAt: '2026-10-09T11:50:00.000Z',
      failure: null,
      metadata: null,
    },
  };
}

describe('PaymentEventDispatcherService', () => {
  const send = jest.fn();
  const enqueueEvent = jest.fn();
  const runWithRlsContext = jest.fn();
  const commerceHandle = jest.fn();
  const commerceHandler = {
    referenceType: 'commerce.order',
    handle: commerceHandle,
  } as unknown as CommerceOrderPaymentHandlerService;

  let dispatcher: PaymentEventDispatcherService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    runWithRlsContext.mockImplementation((_rls: unknown, fn: () => Promise<unknown>) => fn());
    send.mockImplementation((_scope: unknown, _service: string, _cmd: string, data: { ids: string[] }) =>
      Promise.resolve({ acked: data.ids.length }),
    );
    dispatcher = new PaymentEventDispatcherService(
      { send } as unknown as ScopedNatsClientService,
      { enqueueEvent } as unknown as WebhookDeliveryDomainService,
      { runWithRlsContext } as unknown as PrimaryDatabaseService,
      commerceHandler,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('routes each event to the handler registered for its reference type', async () => {
    const otherHandle = jest.fn();
    const other: PaymentEventHandler = { referenceType: 'booking', handle: otherHandle };
    dispatcher.register(other);
    const order = eventOf('e1', 'commerce.order');
    const booking = eventOf('e2', 'booking');

    await dispatcher.dispatch(ORG, [order, booking]);

    expect(commerceHandle).toHaveBeenCalledTimes(1);
    expect(commerceHandle).toHaveBeenCalledWith(ORG, order);
    expect(otherHandle).toHaveBeenCalledTimes(1);
    expect(otherHandle).toHaveBeenCalledWith(ORG, booking);
  });

  it('runs under the organization RLS context', async () => {
    await dispatcher.dispatch(ORG, [eventOf('e1', 'commerce.order')]);

    expect(runWithRlsContext).toHaveBeenCalledWith({ orgId: ORG }, expect.any(Function));
  });

  it('dispatches an event with no registered handler straight to the webhook queue and acknowledges it', async () => {
    const result = await dispatcher.dispatch(ORG, [eventOf('e1', 'subscription.invoice')]);

    expect(commerceHandle).not.toHaveBeenCalled();
    expect(enqueueEvent).toHaveBeenCalledWith(ORG, 'app-1', {
      id: 'e1',
      type: 'payment_intent.succeeded',
      payload: expect.objectContaining({ paymentIntentId: 'pi-e1' }),
    });
    expect(result).toEqual({ dispatched: 1, failed: 0, acked: 1 });
  });

  it('acknowledges only the events whose handler and webhook queueing both succeeded', async () => {
    commerceHandle.mockImplementation((_org: string, event: PaymentEventResponseDto) =>
      event.id === 'bad' ? Promise.reject(new Error('commerce down')) : Promise.resolve(),
    );

    const result = await dispatcher.dispatch(ORG, [
      eventOf('good', 'commerce.order'),
      eventOf('bad', 'commerce.order'),
    ]);

    expect(send).toHaveBeenCalledWith({ orgId: ORG }, 'payments', 'payments.events.ack', { ids: ['good'] });
    expect(result).toEqual({ dispatched: 1, failed: 1, acked: 1 });
  });

  it('does not queue the webhook of an event whose handler failed', async () => {
    commerceHandle.mockRejectedValue(new Error('commerce down'));

    await dispatcher.dispatch(ORG, [eventOf('e1', 'commerce.order')]);

    expect(enqueueEvent).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it.each([
    [409, 'Already Paid'],
    [400, 'Validation Failed'],
    [422, 'Amount Mismatch'],
    [409, 'Order Not Payable'],
  ])('treats a %s %s rejection from commerce as terminal: logs it, queues the webhook and acknowledges', async (status, label) => {
    const error = jest.spyOn(Logger.prototype, 'error');
    commerceHandle.mockRejectedValue({ status, statusCode: status, label, detail: 'Rejected.', errors: [] });

    const result = await dispatcher.dispatch(ORG, [eventOf('e1', 'commerce.order')]);

    expect(error).toHaveBeenCalledWith(expect.stringContaining('e1'));
    expect(error).toHaveBeenCalledWith(expect.stringContaining('pi-e1'));
    expect(enqueueEvent).toHaveBeenCalledWith(ORG, 'app-1', expect.objectContaining({ id: 'e1' }));
    expect(send).toHaveBeenCalledWith({ orgId: ORG }, 'payments', 'payments.events.ack', { ids: ['e1'] });
    expect(result).toEqual({ dispatched: 1, failed: 0, acked: 1 });
  });

  it.each([
    ['a 5xx problem', { status: 503, statusCode: 503, detail: 'Unavailable', errors: [] }],
    ['a NATS timeout', new Error('Timeout has occurred')],
    ['no responders', new Error('Empty response. There are no subscribers listening to that message')],
  ])('leaves an event unacknowledged for the sweep on %s', async (_name, failure) => {
    commerceHandle.mockRejectedValue(failure);

    const result = await dispatcher.dispatch(ORG, [eventOf('e1', 'commerce.order')]);

    expect(enqueueEvent).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(result).toEqual({ dispatched: 0, failed: 1, acked: 0 });
  });

  it('does not acknowledge an event whose webhook could not be queued', async () => {
    enqueueEvent.mockRejectedValue(new Error('db down'));

    const result = await dispatcher.dispatch(ORG, [eventOf('e1', 'commerce.order')]);

    expect(send).not.toHaveBeenCalled();
    expect(result).toEqual({ dispatched: 0, failed: 1, acked: 0 });
  });

  it('skips the webhook queue for an intent no app opened', async () => {
    await dispatcher.dispatch(ORG, [eventOf('e1', 'commerce.order', null)]);

    expect(enqueueEvent).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith({ orgId: ORG }, 'payments', 'payments.events.ack', { ids: ['e1'] });
  });

  it('swallows an ack failure — the events are simply dispatched again later', async () => {
    send.mockRejectedValue(new Error('payments down'));

    await expect(dispatcher.dispatch(ORG, [eventOf('e1', 'commerce.order')])).resolves.toEqual({
      dispatched: 1,
      failed: 0,
      acked: 0,
    });
  });

  it('does nothing for an empty batch', async () => {
    await expect(dispatcher.dispatch(ORG, [])).resolves.toEqual({ dispatched: 0, failed: 0, acked: 0 });
    expect(runWithRlsContext).not.toHaveBeenCalled();
  });

  it('refuses a second handler for the same reference type', () => {
    expect(() => dispatcher.register({ referenceType: 'commerce.order', handle: jest.fn() })).toThrow();
  });
});
