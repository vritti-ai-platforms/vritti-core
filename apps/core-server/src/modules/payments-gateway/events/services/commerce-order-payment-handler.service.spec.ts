import { Logger } from '@nestjs/common';
import type { ScopedNatsClientService } from '@/services/scoped-nats-client.service';
import type { PaymentEventResponseDto } from '../../intents/dto/response/payment-event-response.dto';
import { CommerceOrderPaymentHandlerService } from './commerce-order-payment-handler.service';

const ORG = 'org-1';

function eventOf(type: string, siteId: string | null = 'site-1'): PaymentEventResponseDto {
  return {
    id: 'evt-1',
    intentId: 'pi-1',
    type,
    createdAt: '2026-10-09T11:50:00.000Z',
    payload: {
      paymentIntentId: 'pi-1',
      appId: 'app-1',
      partyId: 'party-1',
      legalEntityId: 'le-1',
      siteId,
      configId: 'cfg-1',
      reference: { type: 'commerce.order', id: 'ord-1' },
      amount: { currency: 'INR', value: '250.50' },
      method: 'upi',
      providerPaymentId: 'pay_1',
      paidAt: '2026-10-09T11:50:00.000Z',
      failure: null,
      metadata: { orderNumber: 'SO-0001' },
    },
  };
}

describe('CommerceOrderPaymentHandlerService', () => {
  const send = jest.fn();
  const handler = new CommerceOrderPaymentHandlerService({ send } as unknown as ScopedNatsClientService);

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    send.mockResolvedValue({});
  });

  afterEach(() => jest.restoreAllMocks());

  it('marks the order paid under the intent site, with the amount in minor units', async () => {
    await handler.handle(ORG, eventOf('payment_intent.succeeded'));

    expect(send).toHaveBeenCalledWith({ orgId: ORG, siteId: 'site-1' }, 'commerce', 'site.orders.markPaid', {
      orderId: 'ord-1',
      paymentIntentId: 'pi-1',
      method: 'upi',
      providerPaymentId: 'pay_1',
      amountMinor: '25050',
      currency: 'INR',
      paidAt: '2026-10-09T11:50:00.000Z',
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('surfaces a commerce failure so the event is retried', async () => {
    send.mockRejectedValue(new Error('commerce down'));

    await expect(handler.handle(ORG, eventOf('payment_intent.succeeded'))).rejects.toThrow('commerce down');
  });

  it('cancels the unpaid order when the intent expires', async () => {
    await handler.handle(ORG, eventOf('payment_intent.expired'));

    expect(send).toHaveBeenCalledWith({ orgId: ORG, siteId: 'site-1' }, 'commerce', 'site.orders.cancelUnpaid', {
      orderId: 'ord-1',
      reason: 'Payment expired before it was completed.',
      paymentIntentId: 'pi-1',
    });
  });

  it('cancels the unpaid order under the intent site when the intent is cancelled', async () => {
    await handler.handle(ORG, eventOf('payment_intent.canceled'));

    expect(send).toHaveBeenCalledWith({ orgId: ORG, siteId: 'site-1' }, 'commerce', 'site.orders.cancelUnpaid', {
      orderId: 'ord-1',
      reason: 'Payment was cancelled.',
      paymentIntentId: 'pi-1',
    });
  });

  it('treats a cancelled order intent without a site as handled', async () => {
    await expect(handler.handle(ORG, eventOf('payment_intent.canceled', null))).resolves.toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  });

  it('leaves the order alone when a payment attempt fails', async () => {
    await handler.handle(ORG, eventOf('payment_intent.payment_failed'));

    expect(send).not.toHaveBeenCalled();
  });

  it('treats an order intent without a site as handled rather than retrying forever', async () => {
    await expect(handler.handle(ORG, eventOf('payment_intent.succeeded', null))).resolves.toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  });
});
