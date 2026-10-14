import type { AppDomainService } from '@domain/app/services/app.service';
import { Logger } from '@nestjs/common';
import type { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { NatsClientService } from '@vritti/api-sdk/nats';
import type { FastifyRequest } from 'fastify';
import type { PaymentIntentResponseDto } from '../../intents/dto/response/payment-intent-response.dto';
import type { PaymentIntentsGatewayService } from '../../intents/services/payment-intents-gateway.service';
import { CheckoutCallbackService } from './checkout-callback.service';

const ORG = '0199e000-0000-7000-8000-000000000001';
const INTENT = '0199e000-0000-7000-8000-0000000000aa';
const APP = 'app-1';
const RETURN_URL = 'https://shop.example/thanks?src=vap';
const CHECKOUT_URL = 'https://shop.example/checkout?retry=key-1';

const intentOf = (overrides: Partial<PaymentIntentResponseDto> = {}): PaymentIntentResponseDto =>
  ({
    id: INTENT,
    appId: APP,
    status: 'REQUIRES_ACTION',
    gatewayCode: 'razorpay',
    metadata: { orderNumber: 'SO-0001' },
    returnUrl: RETURN_URL,
    checkoutUrl: CHECKOUT_URL,
    ...overrides,
  }) as PaymentIntentResponseDto;

const appOf = (overrides: Record<string, unknown> = {}) => ({
  id: APP,
  isActive: true,
  revokedAt: null,
  allowedOrigins: ['https://shop.example'],
  ...overrides,
});

const SUCCESS_BODY = {
  razorpay_payment_id: 'pay_1',
  razorpay_order_id: 'order_1',
  razorpay_signature: 'sig_1',
};

const DECLINE_BODY = {
  'error[code]': 'BAD_REQUEST_ERROR',
  'error[description]': 'Payment failed because the card was declined.',
  'error[reason]': 'payment_failed',
  'error[source]': 'bank',
  'error[step]': 'payment_authorization',
  'error[metadata]': '{"order_id":"order_1","payment_id":"pay_1"}',
};

const requestOf = (): FastifyRequest => ({ auth: undefined }) as unknown as FastifyRequest;

describe('CheckoutCallbackService', () => {
  const runWithRlsContext = jest.fn();
  const send = jest.fn();
  const findInOrg = jest.fn();
  const confirm = jest.fn();
  const service = new CheckoutCallbackService(
    { runWithRlsContext } as unknown as PrimaryDatabaseService,
    { send } as unknown as NatsClientService,
    { findInOrg } as unknown as AppDomainService,
    { confirm } as unknown as PaymentIntentsGatewayService,
  );
  const logged: string[] = [];

  beforeEach(() => {
    jest.resetAllMocks();
    runWithRlsContext.mockImplementation((_rls: unknown, fn: () => Promise<unknown>) => fn());
    send.mockResolvedValue(intentOf());
    findInOrg.mockResolvedValue(appOf());
    confirm.mockResolvedValue({ id: INTENT, status: 'SUCCEEDED' });
    logged.length = 0;
    const capture = (message: unknown) => {
      logged.push(String(message));
    };
    jest.spyOn(Logger.prototype, 'log').mockImplementation(capture);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(capture);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(capture);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('callback', () => {
    it('confirms a success under the URL organization and returns the shopper to the store', async () => {
      const request = requestOf();

      const outcome = await service.handleCallback(request, ORG, INTENT, SUCCESS_BODY);

      expect(request.auth).toEqual({ kind: 'cloud', organizationId: ORG });
      expect(runWithRlsContext).toHaveBeenCalledWith({ orgId: ORG }, expect.any(Function));
      expect(send).toHaveBeenCalledWith('payments', 'payments.intents.get', { paymentIntentId: INTENT });
      expect(findInOrg).toHaveBeenCalledWith(APP, ORG);
      expect(confirm).toHaveBeenCalledWith(
        { orgId: ORG, appId: APP },
        { paymentIntentId: INTENT, gatewayResponse: { orderId: 'order_1', paymentId: 'pay_1', signature: 'sig_1' } },
      );
      expect(outcome).toEqual({
        kind: 'redirect',
        location: `https://shop.example/thanks?src=vap&intent=${INTENT}&order=SO-0001`,
      });
    });

    it('leaves the order out when the intent has no order number', async () => {
      send.mockResolvedValue(intentOf({ metadata: null }));

      const outcome = await service.handleCallback(requestOf(), ORG, INTENT, SUCCESS_BODY);

      expect(outcome).toEqual({ kind: 'redirect', location: `https://shop.example/thanks?src=vap&intent=${INTENT}` });
    });

    it('still returns the shopper to the store when the confirm throws', async () => {
      confirm.mockRejectedValue(new BadRequestException('Invalid Payment Signature'));

      const outcome = await service.handleCallback(requestOf(), ORG, INTENT, SUCCESS_BODY);

      expect(outcome).toMatchObject({
        kind: 'redirect',
        location: expect.stringContaining('https://shop.example/thanks'),
      });
    });

    it('treats a post missing any of the three success fields as a failure', async () => {
      const { razorpay_signature: _dropped, ...partial } = SUCCESS_BODY;

      const outcome = await service.handleCallback(requestOf(), ORG, INTENT, partial);

      expect(confirm).not.toHaveBeenCalled();
      expect(outcome).toMatchObject({ kind: 'redirect', location: expect.stringContaining('payment=failed') });
    });

    it('sends a decline back to checkout with the reason, keeping the retry key', async () => {
      const outcome = await service.handleCallback(requestOf(), ORG, INTENT, DECLINE_BODY);

      expect(confirm).not.toHaveBeenCalled();
      expect(outcome.kind).toBe('redirect');
      const location = new URL((outcome as { location: string }).location);
      expect(location.origin + location.pathname).toBe('https://shop.example/checkout');
      expect(location.searchParams.get('retry')).toBe('key-1');
      expect(location.searchParams.get('payment')).toBe('failed');
      expect(location.searchParams.get('message')).toBe('Payment failed because the card was declined.');
    });

    it('truncates a long decline message to 200 characters', async () => {
      const outcome = await service.handleCallback(requestOf(), ORG, INTENT, {
        ...DECLINE_BODY,
        'error[description]': 'x'.repeat(500),
      });

      const location = new URL((outcome as { location: string }).location);
      expect(location.searchParams.get('message')).toHaveLength(200);
    });

    it('accepts repeated form fields by taking the first value', async () => {
      const outcome = await service.handleCallback(requestOf(), ORG, INTENT, {
        razorpay_payment_id: ['pay_1', 'pay_2'],
        razorpay_order_id: 'order_1',
        razorpay_signature: 'sig_1',
      });

      expect(confirm.mock.calls[0][1].gatewayResponse.paymentId).toBe('pay_1');
      expect(outcome.kind).toBe('redirect');
    });

    it('shows the success page instead of redirecting when the origin is no longer allowed', async () => {
      findInOrg.mockResolvedValue(appOf({ allowedOrigins: ['https://other.example'] }));

      const outcome = await service.handleCallback(requestOf(), ORG, INTENT, SUCCESS_BODY);

      expect(confirm).toHaveBeenCalled();
      expect(outcome).toEqual({ kind: 'page', html: expect.stringContaining('Your payment was received') });
    });

    it('shows the failure page instead of redirecting when the app is inactive', async () => {
      findInOrg.mockResolvedValue(appOf({ isActive: false }));

      const outcome = await service.handleCallback(requestOf(), ORG, INTENT, DECLINE_BODY);

      expect(outcome).toEqual({ kind: 'page', html: expect.stringContaining('did not go through') });
    });

    it('shows a page when the app has been revoked or deleted', async () => {
      findInOrg.mockResolvedValueOnce(appOf({ revokedAt: new Date() }));
      expect((await service.handleCallback(requestOf(), ORG, INTENT, DECLINE_BODY)).kind).toBe('page');

      findInOrg.mockResolvedValueOnce(undefined);
      expect((await service.handleCallback(requestOf(), ORG, INTENT, DECLINE_BODY)).kind).toBe('page');
    });

    it('shows a page when the intent has nowhere to return to', async () => {
      send.mockResolvedValue(intentOf({ returnUrl: null }));

      const outcome = await service.handleCallback(requestOf(), ORG, INTENT, SUCCESS_BODY);

      expect(outcome).toEqual({ kind: 'page', html: expect.stringContaining('Your payment was received') });
    });

    it('shows a page, and never confirms, when the intent is not in that organization', async () => {
      send.mockRejectedValue(new NotFoundException('Payment intent not found.'));

      const outcome = await service.handleCallback(requestOf(), ORG, INTENT, SUCCESS_BODY);

      expect(confirm).not.toHaveBeenCalled();
      expect(outcome).toEqual({ kind: 'page', html: expect.stringContaining('Your payment was received') });
    });

    it('never echoes anything the gateway posted into the page', async () => {
      send.mockResolvedValue(intentOf({ checkoutUrl: null }));

      const outcome = await service.handleCallback(requestOf(), ORG, INTENT, {
        ...DECLINE_BODY,
        'error[description]': '<script>alert(1)</script>',
      });

      expect(outcome.kind).toBe('page');
      expect((outcome as { html: string }).html).not.toContain('<script>');
    });

    it('never logs the signature', async () => {
      await service.handleCallback(requestOf(), ORG, INTENT, SUCCESS_BODY);

      expect(logged.length).toBeGreaterThan(0);
      for (const line of logged) expect(line).not.toContain('sig_1');
    });
  });

  describe('cancel', () => {
    it('sends the shopper back to checkout marked cancelled', async () => {
      const outcome = await service.handleCancel(requestOf(), ORG, INTENT);

      expect(outcome).toEqual({
        kind: 'redirect',
        location: 'https://shop.example/checkout?retry=key-1&payment=cancelled',
      });
    });

    it('shows the failure page when the checkout origin is no longer allowed', async () => {
      findInOrg.mockResolvedValue(appOf({ allowedOrigins: [] }));

      const outcome = await service.handleCancel(requestOf(), ORG, INTENT);

      expect(outcome).toEqual({ kind: 'page', html: expect.stringContaining('did not go through') });
    });
  });

  describe('revisit by GET', () => {
    it('goes back to checkout without adding anything', async () => {
      expect(await service.handleRevisit(requestOf(), ORG, INTENT)).toEqual({
        kind: 'redirect',
        location: CHECKOUT_URL,
      });
    });

    it('falls back to the return page when there is no checkout url', async () => {
      send.mockResolvedValue(intentOf({ checkoutUrl: null }));

      expect(await service.handleRevisit(requestOf(), ORG, INTENT)).toEqual({ kind: 'redirect', location: RETURN_URL });
    });

    it('shows the success page for a paid intent it cannot redirect', async () => {
      send.mockResolvedValue(intentOf({ status: 'SUCCEEDED', checkoutUrl: null, returnUrl: null }));

      const outcome = await service.handleRevisit(requestOf(), ORG, INTENT);

      expect(outcome).toEqual({ kind: 'page', html: expect.stringContaining('Your payment was received') });
    });
  });
});
