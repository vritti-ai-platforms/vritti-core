import { createHash } from 'node:crypto';
import type { AppDomainService } from '@domain/app/services/app.service';
import type { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import type { PayoutChannelDomainService } from '@domain/payout-channel/services/payout-channel.service';
import { Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { NatsClientService } from '@vritti/api-sdk/nats';
import type { SiteContextResolverService } from '@/site-context/site-context-resolver.service';
import type { PaymentEventDispatcherService } from '../../events/services/payment-event-dispatcher.service';
import type { PaymentIntentResponseDto } from '../dto/response/payment-intent-response.dto';
import {
  namespacedIdempotencyKey,
  type PaymentCallerContext,
  PaymentIntentsGatewayService,
} from './payment-intents-gateway.service';

const ORG = 'org-1';
const APP = 'app-1';
const OTHER_APP = 'app-2';
const SITE = 'site-1';
const LE = 'le-1';

const payout = {
  id: 'pa-1',
  organizationId: ORG,
  paymentGatewayConfigId: 'cfg-1',
  bankAccountId: 'bank-1',
  gatewayAccountId: 'acc_main',
  isMainAccount: true,
};
const credentials = { key_id: 'rzp_test_1', key_secret: 'secret' };

function intentOf(overrides: Partial<PaymentIntentResponseDto> = {}): PaymentIntentResponseDto {
  return {
    id: 'pi-1',
    legalEntityId: LE,
    siteId: SITE,
    appId: APP,
    partyId: 'party-1',
    reference: { type: 'booking', id: 'bk-1' },
    description: null,
    configId: 'cfg-1',
    gatewayCode: 'razorpay',
    bankAccountId: null,
    type: 'APP',
    idempotencyKey: 'idem-1',
    receipt: 'rcpt-1',
    amount: { currency: 'INR', value: '12.34' },
    fee: { currency: 'INR', value: '0.00' },
    tax: { currency: 'INR', value: '0.00' },
    status: 'CREATED',
    providerOrderId: 'order_1',
    providerPaymentId: null,
    checkout: { gateway: 'razorpay', key_id: 'rzp_test_1', order_id: 'order_1', amount: 1234, currency: 'INR' },
    method: null,
    customer: null,
    metadata: null,
    failureCode: null,
    failureMessage: null,
    succeededAt: null,
    expiresAt: '2026-10-09T12:00:00.000Z',
    createdAt: '2026-10-09T11:45:00.000Z',
    updatedAt: '2026-10-09T11:45:00.000Z',
    ...overrides,
  };
}

describe('PaymentIntentsGatewayService', () => {
  const send = jest.fn();
  const resolvePayout = jest.fn();
  const findPayableConfigIds = jest.fn();
  const listConfigs = jest.fn();
  const findConfig = jest.fn();
  const getDecryptedCredentials = jest.fn();
  const resolveSite = jest.fn();
  const dispatch = jest.fn();
  const findInOrg = jest.fn();

  const service = new PaymentIntentsGatewayService(
    { send } as unknown as NatsClientService,
    {
      getDecryptedCredentials,
      list: listConfigs,
      findById: findConfig,
    } as unknown as PaymentGatewayConfigDomainService,
    { resolve: resolvePayout, findPayableConfigIds } as unknown as PayoutChannelDomainService,
    { resolve: resolveSite } as unknown as SiteContextResolverService,
    { dispatch } as unknown as PaymentEventDispatcherService,
    { findInOrg } as unknown as AppDomainService,
  );

  const caller: PaymentCallerContext = { orgId: ORG, appId: APP, partyId: 'party-1', siteId: SITE };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    resolveSite.mockResolvedValue({ legalEntityId: LE, siteTimezone: 'Asia/Kolkata', siteCurrencyCode: 'INR' });
    resolvePayout.mockResolvedValue(payout);
    getDecryptedCredentials.mockResolvedValue({ gatewayCode: 'razorpay', keyId: 'rzp_test_1', credentials });
  });

  afterEach(() => jest.restoreAllMocks());

  describe('split at order creation', () => {
    const input = {
      amount: { currency: 'INR', value: '1000.00' },
      reference: { type: 'booking', id: 'bk-1' },
      idempotencyKey: 'idem-split',
      paymentGatewayConfigId: 'cfg-1',
    };

    it('sends no transfers when the payout account is the main account', async () => {
      send.mockResolvedValue(intentOf());

      await service.create(caller, input);

      expect(send.mock.calls[0][2]).not.toHaveProperty('transfers');
      expect(findConfig).not.toHaveBeenCalled();
    });

    it("transfers a linked account the payment less Vritti's fee", async () => {
      resolvePayout.mockResolvedValue({ ...payout, gatewayAccountId: 'acc_linked', isMainAccount: false });
      findConfig.mockResolvedValue({ id: 'cfg-1', platformFeeBps: 150 });
      send.mockResolvedValue(intentOf());

      await service.create(caller, input);

      expect(send.mock.calls[0][2].transfers).toEqual([
        { linkedAccountId: 'pa-1', providerAccountId: 'acc_linked', amount: '98500' },
      ]);
    });

    it('refuses a payment too small to leave a transfer of at least 100 paise', async () => {
      resolvePayout.mockResolvedValue({ ...payout, gatewayAccountId: 'acc_linked', isMainAccount: false });
      findConfig.mockResolvedValue({ id: 'cfg-1', platformFeeBps: 150 });

      await expect(
        service.create(caller, { ...input, amount: { currency: 'INR', value: '1.00' } }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(send).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const input = {
      amount: { currency: 'INR', value: '12.34' },
      reference: { type: 'booking', id: 'bk-1' },
      idempotencyKey: 'idem-1',
      metadata: [{ key: 'slot', value: 'morning' }],
      paymentGatewayConfigId: 'cfg-1',
    };

    it('pays out through the payout account of the picked gateway and sends the amount in minor units', async () => {
      send.mockResolvedValue(intentOf());

      await service.create(caller, input);

      expect(resolvePayout).toHaveBeenCalledWith(
        ORG,
        { legalEntityId: LE, siteId: SITE, appId: APP, channel: 'APP' },
        'cfg-1',
      );
      expect(getDecryptedCredentials).toHaveBeenCalledWith(ORG, 'cfg-1');
      expect(send).toHaveBeenCalledWith(
        'payments',
        'payments.intents.create',
        expect.objectContaining({
          legalEntityId: LE,
          siteId: SITE,
          appId: APP,
          partyId: 'party-1',
          configId: 'cfg-1',
          gatewayCode: 'razorpay',
          bankAccountId: 'bank-1',
          type: 'APP',
          credentials,
          amount: '1234',
          currency: 'INR',
          referenceType: 'booking',
          referenceId: 'bk-1',
          metadata: { slot: 'morning' },
          idempotencyKey: namespacedIdempotencyKey(caller, 'idem-1'),
        }),
      );
    });

    it('namespaces the idempotency key by app and party as a sha256 hex digest', async () => {
      send.mockResolvedValue(intentOf());

      await service.create(caller, input);
      await service.create({ ...caller, appId: OTHER_APP }, input);
      await service.create({ orgId: ORG, appId: APP, siteId: SITE }, input);

      const [own, otherApp, noParty] = send.mock.calls.map((call) => call[2].idempotencyKey as string);
      expect(own).toBe(createHash('sha256').update(`${APP}|party-1|idem-1`).digest('hex'));
      expect(own).toHaveLength(64);
      expect(otherApp).toBe(createHash('sha256').update(`${OTHER_APP}|party-1|idem-1`).digest('hex'));
      expect(noParty).toBe(createHash('sha256').update(`${APP}||idem-1`).digest('hex'));
    });

    it('rejects a reserved commerce. reference type before touching anything', async () => {
      const error = await service
        .create(caller, { ...input, reference: { type: 'commerce.order', id: 'ord-1' } })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      const body = JSON.stringify((error as BadRequestException).getResponse());
      expect(body).toContain('Reserved Reference Type');
      expect(body).toContain('reference.type');
      expect(resolvePayout).not.toHaveBeenCalled();
      expect(send).not.toHaveBeenCalled();
    });

    it('pads a whole-number amount to the currency exponent', async () => {
      send.mockResolvedValue(intentOf());

      await service.create(caller, { ...input, amount: { currency: 'INR', value: '500' } });

      expect(send.mock.calls[0][2]).toMatchObject({ amount: '50000' });
    });

    it('uses the legal entity header when no site is in context, and sends no site', async () => {
      send.mockResolvedValue(intentOf({ siteId: null }));

      await service.create({ orgId: ORG, appId: APP, legalEntityId: 'le-9' }, { ...input, channel: undefined });

      expect(resolveSite).not.toHaveBeenCalled();
      expect(resolvePayout).toHaveBeenCalledWith(
        ORG,
        { legalEntityId: 'le-9', siteId: undefined, appId: APP, channel: 'APP' },
        'cfg-1',
      );
      const payload = send.mock.calls[0][2];
      expect(payload.legalEntityId).toBe('le-9');
      expect(payload.siteId).toBeUndefined();
      expect(payload.partyId).toBeUndefined();
    });

    it('answers 400 Payments Not Set Up when the picked gateway has no payout account here, before decrypting', async () => {
      resolvePayout.mockResolvedValue(undefined);

      const error = await service.create(caller, input).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(JSON.stringify((error as BadRequestException).getResponse())).toContain('Payments Not Set Up');
      expect(getDecryptedCredentials).not.toHaveBeenCalled();
      expect(send).not.toHaveBeenCalled();
    });

    it('rejects a zero amount', async () => {
      await expect(
        service.create(caller, { ...input, amount: { currency: 'INR', value: '0' } }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(send).not.toHaveBeenCalled();
    });

    it('rejects a call with neither a site nor a legal entity in context', async () => {
      await expect(service.create({ orgId: ORG, appId: APP }, input)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns the checkout launch data as a JSON string without the gateway key', async () => {
      send.mockResolvedValue(intentOf());

      const result = await service.create(caller, input);

      expect(result.checkout?.gateway).toBe('razorpay');
      expect(JSON.parse(result.checkout?.payload ?? '{}')).toEqual({
        key_id: 'rzp_test_1',
        order_id: 'order_1',
        amount: 1234,
        currency: 'INR',
      });
      expect(result.amount).toEqual({ currency: 'INR', value: '12.34' });
      expect(result.failure).toBeNull();
    });
  });

  describe('app isolation', () => {
    it('hides another app intent behind a 404 on read', async () => {
      send.mockResolvedValue(intentOf({ appId: OTHER_APP }));

      await expect(service.findById(caller, 'pi-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('never confirms another app intent and never decrypts its credentials', async () => {
      send.mockResolvedValue(intentOf({ appId: OTHER_APP }));

      await expect(
        service.confirm(caller, {
          paymentIntentId: 'pi-1',
          gatewayResponse: { orderId: 'order_1', paymentId: 'pay_1', signature: 'sig' },
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(getDecryptedCredentials).not.toHaveBeenCalled();
      expect(send).toHaveBeenCalledTimes(1);
    });

    it('never cancels another app intent', async () => {
      send.mockResolvedValue(intentOf({ appId: OTHER_APP }));

      await expect(service.cancel(caller, 'pi-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(send).toHaveBeenCalledTimes(1);
    });

    it('hides an intent with no app from every app', async () => {
      send.mockResolvedValue(intentOf({ appId: null }));

      await expect(service.findById(caller, 'pi-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('hides another party intent within the same app', async () => {
      send.mockResolvedValue(intentOf({ partyId: 'party-2' }));

      await expect(service.findById(caller, 'pi-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('reads its own intent', async () => {
      send.mockResolvedValue(intentOf());

      await expect(service.findById(caller, 'pi-1')).resolves.toMatchObject({ id: 'pi-1', status: 'CREATED' });
    });

    it('hides a shopper intent from a caller with no party on read', async () => {
      send.mockResolvedValue(intentOf());

      await expect(service.findById({ orgId: ORG, appId: APP }, 'pi-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses to cancel a shopper intent for a caller with no party', async () => {
      send.mockResolvedValue(intentOf());

      await expect(service.cancel({ orgId: ORG, appId: APP }, 'pi-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(send).toHaveBeenCalledTimes(1);
    });

    it('refuses to cancel another party intent', async () => {
      send.mockResolvedValue(intentOf({ partyId: 'party-2' }));

      await expect(service.cancel(caller, 'pi-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(send).toHaveBeenCalledTimes(1);
    });

    it('reads an intent no party opened without a party', async () => {
      send.mockResolvedValue(intentOf({ partyId: null }));

      await expect(service.findById({ orgId: ORG, appId: APP }, 'pi-1')).resolves.toMatchObject({ id: 'pi-1' });
    });

    it('confirms a shopper intent from a gateway callback that carries no party', async () => {
      send.mockResolvedValueOnce(intentOf()).mockResolvedValueOnce({ intent: intentOf(), events: [] });

      await expect(
        service.confirm(
          { orgId: ORG, appId: APP },
          {
            paymentIntentId: 'pi-1',
            gatewayResponse: { orderId: 'order_1', paymentId: 'pay_1', signature: 'sig' },
          },
        ),
      ).resolves.toMatchObject({ id: 'pi-1' });
    });

    it('still refuses to confirm another party intent', async () => {
      send.mockResolvedValue(intentOf({ partyId: 'party-2' }));

      await expect(
        service.confirm(caller, {
          paymentIntentId: 'pi-1',
          gatewayResponse: { orderId: 'order_1', paymentId: 'pay_1', signature: 'sig' },
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('reads the new reply shape and dispatches the cancellation events inline', async () => {
      const events = [{ id: 'evt-9', intentId: 'pi-1', type: 'payment_intent.canceled', payload: {}, createdAt: '' }];
      send
        .mockResolvedValueOnce(intentOf())
        .mockResolvedValueOnce({ intent: intentOf({ status: 'CANCELED' }), events });

      const result = await service.cancel(caller, 'pi-1');

      expect(send).toHaveBeenLastCalledWith('payments', 'payments.intents.cancel', { paymentIntentId: 'pi-1' });
      expect(dispatch).toHaveBeenCalledWith(ORG, events);
      expect(result).toMatchObject({ id: 'pi-1', status: 'CANCELED' });
    });
  });

  describe('confirm', () => {
    it('confirms with the intent config credentials and dispatches the returned events', async () => {
      const events = [{ id: 'evt-1', intentId: 'pi-1', type: 'payment_intent.succeeded', payload: {}, createdAt: '' }];
      send.mockResolvedValueOnce(intentOf()).mockResolvedValueOnce({
        intent: intentOf({ status: 'SUCCEEDED', succeededAt: '2026-10-09T11:50:00.000Z' }),
        events,
      });

      const result = await service.confirm(caller, {
        paymentIntentId: 'pi-1',
        gatewayResponse: { orderId: 'order_1', paymentId: 'pay_1', signature: 'sig' },
      });

      expect(getDecryptedCredentials).toHaveBeenCalledWith(ORG, 'cfg-1');
      expect(send).toHaveBeenLastCalledWith('payments', 'payments.intents.confirm', {
        paymentIntentId: 'pi-1',
        credentials,
        gatewayResponse: { orderId: 'order_1', paymentId: 'pay_1', signature: 'sig' },
      });
      expect(dispatch).toHaveBeenCalledWith(ORG, events);
      expect(result).toMatchObject({ status: 'SUCCEEDED', paidAt: '2026-10-09T11:50:00.000Z' });
    });
  });

  describe('listCheckoutGateways', () => {
    it('offers only the gateways with a payout account that fits the store, app and channel', async () => {
      findPayableConfigIds.mockResolvedValue(['cfg-1']);
      listConfigs.mockResolvedValue([
        {
          id: 'cfg-1',
          gatewayCode: 'razorpay',
          label: 'Vritti Razorpay',
          logoLightUrl: 'https://cdn/rzp.svg',
          logoDarkUrl: null,
        },
        { id: 'cfg-2', gatewayCode: 'razorpay', label: 'Unused', logoLightUrl: null, logoDarkUrl: null },
      ]);

      const result = await service.listCheckoutGateways(caller, 'POS');

      expect(findPayableConfigIds).toHaveBeenCalledWith(ORG, {
        legalEntityId: LE,
        siteId: SITE,
        appId: APP,
        channel: 'POS',
      });
      expect(result).toEqual([
        {
          id: 'cfg-1',
          gatewayCode: 'razorpay',
          label: 'Vritti Razorpay',
          logoLightUrl: 'https://cdn/rzp.svg',
          logoDarkUrl: null,
        },
      ]);
    });

    it('answers an empty list without reading the configs when nothing pays out here', async () => {
      findPayableConfigIds.mockResolvedValue([]);

      await expect(service.listCheckoutGateways(caller, 'APP')).resolves.toEqual([]);
      expect(listConfigs).not.toHaveBeenCalled();
    });
  });

  describe('startCheckoutFromCart', () => {
    const input = { idempotencyKey: 'chk-1', paymentGatewayConfigId: 'cfg-1' };
    const order = {
      orderId: 'ord-1',
      orderNumber: 'SO-0001',
      total: { currency: 'INR', value: '250.00' },
      totalMinor: '25000',
      reused: false,
    };
    const rejection = { status: 409, label: 'Amount Mismatch', detail: 'Rejected.', errors: [] };

    it("prices the basket in the site's own currency when the storefront sends none", async () => {
      send
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(intentOf({ reference: { type: 'commerce.order', id: 'ord-1' } }));

      await service.startCheckoutFromCart(caller, input);

      expect(send).toHaveBeenNthCalledWith(
        1,
        'commerce',
        'site.orders.createFromCart',
        expect.objectContaining({ currencyCode: 'INR' }),
      );
    });

    it("accepts a currency that agrees with the site's", async () => {
      send
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(intentOf({ reference: { type: 'commerce.order', id: 'ord-1' } }));

      await service.startCheckoutFromCart(caller, { ...input, currencyCode: 'INR' });

      expect(send).toHaveBeenCalledTimes(2);
    });

    it("refuses a currency other than the site's before opening an order", async () => {
      const error = await service.startCheckoutFromCart(caller, { ...input, currencyCode: 'USD' }).catch((e) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({ label: 'Currency Mismatch' });
      expect(send).not.toHaveBeenCalled();
    });

    it('refuses a site whose legal entity has no currency', async () => {
      resolveSite.mockResolvedValue({ legalEntityId: LE, siteTimezone: 'Asia/Kolkata', siteCurrencyCode: undefined });

      const error = await service.startCheckoutFromCart(caller, input).catch((e) => e);

      expect((error as BadRequestException).getResponse()).toMatchObject({ label: 'Currency Not Set' });
      expect(send).not.toHaveBeenCalled();
    });

    it('prefills the gateway with the shopper, dropping an email that is not one', async () => {
      send
        .mockResolvedValueOnce({
          ...order,
          customer: { name: 'Asha Rao', phone: '+919876543210', email: 'not-an-email' },
        })
        .mockResolvedValueOnce(intentOf({ reference: { type: 'commerce.order', id: 'ord-1' } }));

      await service.startCheckoutFromCart(caller, input);

      expect(send).toHaveBeenNthCalledWith(
        2,
        'payments',
        'payments.intents.create',
        expect.objectContaining({ customer: { name: 'Asha Rao', phone: '+919876543210' } }),
      );
    });

    it('creates the order, then an intent referencing it for the order total', async () => {
      send
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(intentOf({ reference: { type: 'commerce.order', id: 'ord-1' } }));

      const session = await service.startCheckoutFromCart(caller, input);

      // The checkout key goes to commerce too, so a retried checkout reuses its order instead of opening another
      expect(send).toHaveBeenNthCalledWith(1, 'commerce', 'site.orders.createFromCart', {
        appId: APP,
        partyId: 'party-1',
        currencyCode: 'INR',
        idempotencyKey: 'chk-1',
      });
      expect(send).toHaveBeenNthCalledWith(
        2,
        'payments',
        'payments.intents.create',
        expect.objectContaining({
          amount: '25000',
          currency: 'INR',
          referenceType: 'commerce.order',
          referenceId: 'ord-1',
          description: 'Order SO-0001',
          metadata: { orderNumber: 'SO-0001' },
          idempotencyKey: createHash('sha256').update(`${APP}|party-1|chk-1`).digest('hex'),
        }),
      );
      expect(session.order).toEqual({ id: 'ord-1', orderNumber: 'SO-0001', total: order.total });
      expect(session.paymentIntent.id).toBe('pi-1');
    });

    it('cancels the order it just opened and rethrows when payments refuses the intent for good', async () => {
      send.mockResolvedValueOnce(order).mockRejectedValueOnce(rejection).mockResolvedValueOnce({});

      await expect(service.startCheckoutFromCart(caller, input)).rejects.toBe(rejection);

      expect(send).toHaveBeenLastCalledWith('commerce', 'site.orders.cancelUnpaid', {
        orderId: 'ord-1',
        reason: expect.any(String),
      });
    });

    it('never cancels a reused order, even on a definitive rejection', async () => {
      send.mockResolvedValueOnce({ ...order, reused: true }).mockRejectedValueOnce(rejection);

      await expect(service.startCheckoutFromCart(caller, input)).rejects.toBe(rejection);
      expect(send).toHaveBeenCalledTimes(2);
    });

    it('leaves the order for the expiry sweep when the intent call times out', async () => {
      const timeout = new Error('Timeout has occurred');
      send.mockResolvedValueOnce(order).mockRejectedValueOnce(timeout);

      await expect(service.startCheckoutFromCart(caller, input)).rejects.toBe(timeout);
      expect(send).toHaveBeenCalledTimes(2);
    });

    it('leaves the order for the expiry sweep on a 5xx from payments', async () => {
      const unavailable = { status: 503, detail: 'Gateway unavailable', errors: [] };
      send.mockResolvedValueOnce(order).mockRejectedValueOnce(unavailable);

      await expect(service.startCheckoutFromCart(caller, input)).rejects.toBe(unavailable);
      expect(send).toHaveBeenCalledTimes(2);
    });

    it('still surfaces the original error when the cancellation itself fails', async () => {
      send.mockResolvedValueOnce(order).mockRejectedValueOnce(rejection).mockRejectedValueOnce(new Error('nats down'));

      await expect(service.startCheckoutFromCart(caller, input)).rejects.toBe(rejection);
    });

    it('creates no order when the picked gateway has no payout account here', async () => {
      resolvePayout.mockResolvedValue(undefined);

      await expect(service.startCheckoutFromCart(caller, input)).rejects.toBeInstanceOf(BadRequestException);
      expect(send).not.toHaveBeenCalled();
    });

    it('requires a party', async () => {
      await expect(
        service.startCheckoutFromCart({ orgId: ORG, appId: APP, siteId: SITE }, input),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(send).not.toHaveBeenCalled();
    });

    it('requires a site', async () => {
      await expect(
        service.startCheckoutFromCart({ orgId: ORG, appId: APP, partyId: 'party-1', legalEntityId: LE }, input),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(send).not.toHaveBeenCalled();
    });
  });

  describe('storefront urls', () => {
    const input = {
      amount: { currency: 'INR', value: '12.34' },
      reference: { type: 'booking', id: 'bk-1' },
      idempotencyKey: 'idem-1',
      paymentGatewayConfigId: 'cfg-1',
    };
    const allowing = (...allowedOrigins: string[]) => findInOrg.mockResolvedValue({ id: APP, allowedOrigins });

    it('passes urls whose origin the app allows through to payments-service', async () => {
      allowing('https://shop.example');
      send.mockResolvedValue(intentOf());

      await service.create(caller, {
        ...input,
        returnUrl: 'https://shop.example/thanks?x=1',
        checkoutUrl: 'https://shop.example/checkout?retry=k1',
      });

      expect(findInOrg).toHaveBeenCalledWith(APP, ORG);
      expect(send).toHaveBeenCalledWith(
        'payments',
        'payments.intents.create',
        expect.objectContaining({
          returnUrl: 'https://shop.example/thanks?x=1',
          checkoutUrl: 'https://shop.example/checkout?retry=k1',
        }),
      );
    });

    it('allows a plain-http localhost storefront the app lists', async () => {
      allowing('http://localhost:3000');
      send.mockResolvedValue(intentOf());

      await service.create(caller, { ...input, returnUrl: 'http://localhost:3000/thanks' });

      expect(send).toHaveBeenCalledWith(
        'payments',
        'payments.intents.create',
        expect.objectContaining({ returnUrl: 'http://localhost:3000/thanks' }),
      );
    });

    it('refuses a return url on an origin the app does not allow, naming the origin', async () => {
      allowing('https://shop.example');

      const error = await service
        .create(caller, { ...input, returnUrl: 'https://evil.example/steal' })
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        label: string;
        detail: string;
        errors: { field: string }[];
      };
      expect(response.label).toBe('Return URL Not Allowed');
      expect(response.detail).toContain('https://evil.example');
      expect(response.detail).toContain('Vritti Cloud');
      expect(response.errors).toEqual([expect.objectContaining({ field: 'returnUrl' })]);
      expect(send).not.toHaveBeenCalled();
    });

    it('refuses a checkout url on a different port of an allowed host', async () => {
      allowing('http://localhost:3000');

      const error = await service
        .create(caller, { ...input, checkoutUrl: 'http://localhost:4000/checkout' })
        .catch((caught: unknown) => caught);

      expect((error as BadRequestException).getResponse()).toMatchObject({
        label: 'Return URL Not Allowed',
        errors: [expect.objectContaining({ field: 'checkoutUrl' })],
      });
    });

    it('refuses plain http on a public host even when its origin is listed', async () => {
      allowing('http://shop.example');

      await expect(
        service.create(caller, { ...input, returnUrl: 'http://shop.example/thanks' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses any url when the app allows no origins', async () => {
      allowing();

      await expect(
        service.create(caller, { ...input, returnUrl: 'https://shop.example/thanks' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('does not look the app up when no url is sent', async () => {
      send.mockResolvedValue(intentOf());

      await service.create(caller, input);

      expect(findInOrg).not.toHaveBeenCalled();
      expect(send.mock.calls[0][2]).not.toHaveProperty('returnUrl');
    });

    it('checks checkout urls before an order is opened from the cart', async () => {
      allowing('https://shop.example');

      await expect(
        service.startCheckoutFromCart(caller, {
          idempotencyKey: 'chk-1',
          paymentGatewayConfigId: 'cfg-1',
          returnUrl: 'https://evil.example/',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(send).not.toHaveBeenCalled();
    });
  });

  describe('checkout callback paths', () => {
    it('points a razorpay checkout with storefront urls at core', async () => {
      send.mockResolvedValue(intentOf({ returnUrl: 'https://shop.example/thanks' }));

      const intent = await service.findById(caller, 'pi-1');

      expect(intent.checkout).toMatchObject({
        gateway: 'razorpay',
        callbackPath: `/payments/checkout/${ORG}/pi-1/callback`,
        cancelPath: `/payments/checkout/${ORG}/pi-1/cancel`,
      });
    });

    it('points an hdfc-razorpay checkout with only a checkout url at core', async () => {
      send.mockResolvedValue(
        intentOf({
          gatewayCode: 'hdfc-razorpay',
          checkout: { gateway: 'hdfc-razorpay', order_id: 'order_1' },
          checkoutUrl: 'https://shop.example/checkout',
        }),
      );

      const intent = await service.findById(caller, 'pi-1');

      expect(intent.checkout?.callbackPath).toBe(`/payments/checkout/${ORG}/pi-1/callback`);
    });

    it('leaves the paths null for an intent with no storefront urls', async () => {
      send.mockResolvedValue(intentOf());

      const intent = await service.findById(caller, 'pi-1');

      expect(intent.checkout).toMatchObject({ callbackPath: null, cancelPath: null });
    });

    it('leaves the paths null for a gateway core cannot host the callback for', async () => {
      send.mockResolvedValue(
        intentOf({
          gatewayCode: 'cashfree',
          checkout: { gateway: 'cashfree' },
          returnUrl: 'https://shop.example/thanks',
        }),
      );

      const intent = await service.findById(caller, 'pi-1');

      expect(intent.checkout).toMatchObject({ callbackPath: null, cancelPath: null });
    });
  });
});
