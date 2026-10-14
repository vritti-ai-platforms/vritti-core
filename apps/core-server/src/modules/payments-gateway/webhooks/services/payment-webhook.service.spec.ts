import type { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { Logger } from '@nestjs/common';
import type { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@vritti/api-sdk/exceptions';
import type { NatsClientService } from '@vritti/api-sdk/nats';
import type { FastifyRequest } from 'fastify';
import type { PaymentEventDispatcherService } from '../../events/services/payment-event-dispatcher.service';
import { PaymentWebhookService } from './payment-webhook.service';

const RAW_BODY = '{"event":"payment.captured","payload":{"id":"pay_secret_1"}}';
const SECRET = 'whsec_super_secret';
const ORG = 'org-1';

const target = { id: 'pgc-1', organizationId: ORG, gatewayCode: 'razorpay', webhookSecret: SECRET };

const requestOf = (headers: Record<string, string | string[] | undefined>, rawBody?: string): FastifyRequest =>
  ({ rawBody, headers, auth: undefined }) as unknown as FastifyRequest;

describe('PaymentWebhookService', () => {
  const runWithRlsContext = jest.fn();
  const findWebhookTarget = jest.fn();
  const send = jest.fn();
  const db = { runWithRlsContext } as unknown as PrimaryDatabaseService;
  const configService = { findWebhookTarget } as unknown as PaymentGatewayConfigDomainService;
  const nats = { send } as unknown as NatsClientService;
  const dispatch = jest.fn();
  const dispatcher = { dispatch } as unknown as PaymentEventDispatcherService;
  const service = new PaymentWebhookService(db, configService, nats, dispatcher);
  const logged: string[] = [];

  beforeEach(() => {
    jest.resetAllMocks();
    runWithRlsContext.mockImplementation((_rls: unknown, fn: () => Promise<unknown>) => fn());
    logged.length = 0;
    const capture = (message: unknown) => {
      logged.push(String(message));
    };
    jest.spyOn(Logger.prototype, 'log').mockImplementation(capture);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(capture);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(capture);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(capture);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads the config under the URL organization and forwards the raw body, lower-cased headers and decrypted secret', async () => {
    findWebhookTarget.mockResolvedValue(target);
    send.mockResolvedValue({ accepted: true, duplicate: false, eventIds: ['evt_1'] });
    const request = requestOf(
      {
        'X-Razorpay-Signature': 'sig',
        'content-type': 'application/json',
        'x-forwarded-for': ['1.1.1.1', '2.2.2.2'],
        'x-empty': undefined,
      },
      RAW_BODY,
    );

    const result = await service.ingest(request, ORG, 'razorpay', 'pgc-1');

    expect(runWithRlsContext).toHaveBeenCalledWith({ orgId: ORG }, expect.any(Function));
    expect(findWebhookTarget).toHaveBeenCalledWith(ORG, 'pgc-1');
    expect(send).toHaveBeenCalledWith('payments', 'payments.webhooks.ingest', {
      organizationId: ORG,
      configId: 'pgc-1',
      gatewayCode: 'razorpay',
      webhookSecret: SECRET,
      rawBody: RAW_BODY,
      headers: {
        'x-razorpay-signature': 'sig',
        'content-type': 'application/json',
        'x-forwarded-for': '1.1.1.1, 2.2.2.2',
      },
    });
    expect(request.auth).toEqual({ kind: 'cloud', organizationId: ORG });
    expect(result).toEqual({ accepted: true, duplicate: false, eventIds: ['evt_1'] });
  });

  it('dispatches the payment events the ingest produced and returns only the ingest outcome', async () => {
    findWebhookTarget.mockResolvedValue(target);
    const paymentEvents = [{ id: 'evt-1', intentId: 'pi-1', type: 'payment_intent.succeeded', payload: {} }];
    send.mockResolvedValue({ accepted: true, duplicate: false, eventIds: ['evt_1'], paymentEvents });
    dispatch.mockResolvedValue({ dispatched: 1, failed: 0, acked: 1 });

    const result = await service.ingest(requestOf({}, RAW_BODY), ORG, 'razorpay', 'pgc-1');

    expect(dispatch).toHaveBeenCalledWith(ORG, paymentEvents);
    expect(result).toEqual({ accepted: true, duplicate: false, eventIds: ['evt_1'] });
  });

  it('dispatches nothing when the ingest produced no payment events', async () => {
    findWebhookTarget.mockResolvedValue(target);
    send.mockResolvedValue({ accepted: true, duplicate: true, eventIds: [], paymentEvents: [] });

    await service.ingest(requestOf({}, RAW_BODY), ORG, 'razorpay', 'pgc-1');

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('forwards a null secret for a config that has none on file', async () => {
    findWebhookTarget.mockResolvedValue({ ...target, webhookSecret: null });
    send.mockResolvedValue({ accepted: false, duplicate: false, eventIds: [] });

    await service.ingest(requestOf({}, RAW_BODY), ORG, 'razorpay', 'pgc-1');

    expect(send.mock.calls[0][2]).toMatchObject({ webhookSecret: null });
  });

  it('rejects a config that belongs to another gateway with not found and never forwards', async () => {
    findWebhookTarget.mockResolvedValue(target);
    const request = requestOf({}, RAW_BODY);

    await expect(service.ingest(request, ORG, 'cashfree', 'pgc-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(send).not.toHaveBeenCalled();
    expect(request.auth).toBeUndefined();
  });

  it('rejects an unknown config, or one the URL organization does not own, with not found', async () => {
    findWebhookTarget.mockResolvedValue(undefined);

    await expect(service.ingest(requestOf({}, RAW_BODY), ORG, 'razorpay', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects an empty body before touching the config', async () => {
    await expect(service.ingest(requestOf({}), ORG, 'razorpay', 'pgc-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(findWebhookTarget).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('lets a signature rejection from payments-service surface unchanged', async () => {
    findWebhookTarget.mockResolvedValue(target);
    const rejection = new UnauthorizedException('Invalid webhook signature.');
    send.mockRejectedValue(rejection);

    await expect(service.ingest(requestOf({}, RAW_BODY), ORG, 'razorpay', 'pgc-1')).rejects.toBe(rejection);
  });

  it('lets a 503 processing failure from payments-service surface so the provider redelivers', async () => {
    findWebhookTarget.mockResolvedValue(target);
    const failure = {
      status: 503,
      statusCode: 503,
      label: 'Webhook Not Processed',
      detail: 'Retry later.',
      errors: [],
    };
    send.mockRejectedValue(failure);

    await expect(service.ingest(requestOf({}, RAW_BODY), ORG, 'razorpay', 'pgc-1')).rejects.toBe(failure);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('never logs the body or the secret', async () => {
    findWebhookTarget.mockResolvedValue(target);
    send.mockResolvedValue({ accepted: true, duplicate: false, eventIds: [] });

    await service.ingest(requestOf({ 'x-razorpay-signature': 'sig' }, RAW_BODY), ORG, 'razorpay', 'pgc-1');

    expect(logged.length).toBeGreaterThan(0);
    for (const line of logged) {
      expect(line).not.toContain(RAW_BODY);
      expect(line).not.toContain('pay_secret_1');
      expect(line).not.toContain(SECRET);
    }
  });
});
