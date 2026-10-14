import { lookup } from 'node:dns/promises';
import { Logger } from '@nestjs/common';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { generateSigningKeyPair } from '@vritti/api-sdk/signing';
import type { AppWebhookEndpoint, WebhookDelivery } from '@/db/schema';
import type { AppWebhookEndpointDomainRepository } from '../repositories/app-webhook-endpoint.repository';
import type { WebhookDeliveryDomainRepository } from '../repositories/webhook-delivery.repository';
import { verifyWebhookSignature } from '../webhook-signature';
import { WebhookDeliveryDomainService } from './webhook-delivery.service';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));

const lookupMock = lookup as unknown as jest.Mock;

const ORG = 'org-1';
const APP = 'app-1';

function endpointOf(overrides: Partial<AppWebhookEndpoint> = {}): AppWebhookEndpoint {
  return {
    id: 'ep-1',
    organizationId: ORG,
    appId: APP,
    url: 'https://shop.example.com/hooks',
    events: ['payment_intent.succeeded'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function deliveryOf(overrides: Partial<WebhookDelivery> = {}): WebhookDelivery {
  return {
    id: 'del-1',
    organizationId: ORG,
    appId: APP,
    endpointId: 'ep-1',
    eventId: 'evt-1',
    eventType: 'payment_intent.succeeded',
    payload: { paymentIntentId: 'pi-1' },
    status: 'PENDING',
    attempts: 0,
    nextAttemptAt: new Date('2026-10-09T12:00:00.000Z'),
    lastStatusCode: null,
    lastError: null,
    deliveredAt: null,
    createdAt: new Date('2026-10-09T11:59:00.000Z'),
    ...overrides,
  };
}

describe('WebhookDeliveryDomainService', () => {
  const insertOnce = jest.fn();
  const claimDue = jest.fn();
  const findTargets = jest.fn();
  const update = jest.fn();
  const findForApp = jest.fn();
  const findByApp = jest.fn();
  const requeueIfIdle = jest.fn();
  const service = new WebhookDeliveryDomainService(
    {
      insertOnce,
      claimDue,
      findTargets,
      update,
      findForApp,
      requeueIfIdle,
    } as unknown as WebhookDeliveryDomainRepository,
    { findByApp } as unknown as AppWebhookEndpointDomainRepository,
  );
  const keys = generateSigningKeyPair();
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    fetchMock = jest.spyOn(globalThis, 'fetch');
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('enqueueEvent', () => {
    const event = { id: 'evt-1', type: 'payment_intent.succeeded', payload: { paymentIntentId: 'pi-1' } };

    it('queues an event the active endpoint subscribes to', async () => {
      findByApp.mockResolvedValue(endpointOf());
      insertOnce.mockResolvedValue(deliveryOf());

      await expect(service.enqueueEvent(ORG, APP, event)).resolves.toBe('del-1');
      expect(insertOnce).toHaveBeenCalledWith({
        organizationId: ORG,
        appId: APP,
        endpointId: 'ep-1',
        eventId: 'evt-1',
        eventType: 'payment_intent.succeeded',
        payload: { paymentIntentId: 'pi-1' },
      });
    });

    it('queues nothing for an event type the endpoint does not subscribe to', async () => {
      findByApp.mockResolvedValue(endpointOf({ events: ['payment_intent.expired'] }));

      await expect(service.enqueueEvent(ORG, APP, event)).resolves.toBeNull();
      expect(insertOnce).not.toHaveBeenCalled();
    });

    it('queues nothing for an inactive endpoint', async () => {
      findByApp.mockResolvedValue(endpointOf({ isActive: false }));

      await expect(service.enqueueEvent(ORG, APP, event)).resolves.toBeNull();
      expect(insertOnce).not.toHaveBeenCalled();
    });

    it('queues nothing when the app has no endpoint', async () => {
      findByApp.mockResolvedValue(undefined);

      await expect(service.enqueueEvent(ORG, APP, event)).resolves.toBeNull();
      expect(insertOnce).not.toHaveBeenCalled();
    });
  });

  describe('enqueueTest', () => {
    it('queues a webhook.test event whatever the endpoint subscribes to', async () => {
      findByApp.mockResolvedValue(endpointOf({ events: [] }));
      insertOnce.mockResolvedValue(deliveryOf({ id: 'del-test' }));

      await expect(service.enqueueTest(ORG, APP)).resolves.toEqual({ deliveryId: 'del-test' });
      expect(insertOnce).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'webhook.test',
          eventId: expect.stringMatching(/^test_[0-9a-f-]{36}$/),
          payload: { message: 'Test event from Vritti' },
        }),
      );
    });

    it('is a 404 when the app has no endpoint', async () => {
      findByApp.mockResolvedValue(undefined);

      await expect(service.enqueueTest(ORG, APP)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws an RFC 9457 exception, not a plain Error, when the test event could not be queued', async () => {
      findByApp.mockResolvedValue(endpointOf());
      insertOnce.mockResolvedValue(undefined);

      await expect(service.enqueueTest(ORG, APP)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('deliverDue', () => {
    const now = new Date('2026-10-09T12:00:00.000Z');

    it('POSTs a signed body that verifies against the app public key and marks it delivered on 2xx', async () => {
      const delivery = deliveryOf();
      claimDue.mockResolvedValue([delivery]);
      findTargets.mockResolvedValue([
        { delivery, url: 'https://shop.example.com/hooks', signingKey: keys.privateKey, appActive: true },
      ]);
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

      const result = await service.deliverDue(ORG, now);

      expect(claimDue).toHaveBeenCalledWith(ORG, now, expect.any(Date), expect.any(Number));
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      const body = init.body as string;
      expect(url).toBe('https://shop.example.com/hooks');
      expect(init.method).toBe('POST');
      expect(init.redirect).toBe('manual');
      expect(headers['content-type']).toBe('application/json');
      expect(headers['x-vap-event-id']).toBe('evt-1');
      expect(headers['x-vap-timestamp']).toMatch(/^\d+$/);
      expect(JSON.parse(body)).toEqual({
        id: 'evt-1',
        type: 'payment_intent.succeeded',
        createdAt: '2026-10-09T11:59:00.000Z',
        data: { paymentIntentId: 'pi-1' },
      });
      expect(verifyWebhookSignature(keys.publicKey, headers['x-vap-timestamp'], body, headers['x-vap-signature'])).toBe(
        true,
      );
      expect(update).toHaveBeenCalledWith(
        'del-1',
        expect.objectContaining({ status: 'DELIVERED', attempts: 1, lastStatusCode: 204 }),
      );
      expect(result).toEqual({ attempted: 1, delivered: 1, failed: 0 });
    });

    it('schedules the next retry on a non-2xx answer', async () => {
      const delivery = deliveryOf({ attempts: 1 });
      claimDue.mockResolvedValue([delivery]);
      findTargets.mockResolvedValue([
        { delivery, url: 'https://shop.example.com/hooks', signingKey: keys.privateKey, appActive: true },
      ]);
      fetchMock.mockResolvedValue(new Response('nope', { status: 500 }));
      const before = Date.now();

      await service.deliverDue(ORG, now);

      const [, values] = update.mock.calls[0] as [string, Partial<WebhookDelivery>];
      expect(values).toMatchObject({ status: 'PENDING', attempts: 2, lastStatusCode: 500, lastError: 'HTTP 500' });
      const delay = (values.nextAttemptAt as Date).getTime() - before;
      expect(delay).toBeGreaterThanOrEqual(5 * 60_000 - 1000);
      expect(delay).toBeLessThanOrEqual(5 * 60_000 + 1000);
    });

    it('counts a redirect as a failure', async () => {
      const delivery = deliveryOf();
      claimDue.mockResolvedValue([delivery]);
      findTargets.mockResolvedValue([
        { delivery, url: 'https://shop.example.com/hooks', signingKey: keys.privateKey, appActive: true },
      ]);
      fetchMock.mockResolvedValue(new Response(null, { status: 302, headers: { location: 'http://10.0.0.1/' } }));

      await service.deliverDue(ORG, now);

      expect(update).toHaveBeenCalledWith('del-1', expect.objectContaining({ status: 'PENDING', lastStatusCode: 302 }));
    });

    it('marks the delivery FAILED when the sixth attempt fails', async () => {
      const delivery = deliveryOf({ attempts: 5 });
      claimDue.mockResolvedValue([delivery]);
      findTargets.mockResolvedValue([
        { delivery, url: 'https://shop.example.com/hooks', signingKey: keys.privateKey, appActive: true },
      ]);
      fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED'));

      const result = await service.deliverDue(ORG, now);

      expect(update).toHaveBeenCalledWith(
        'del-1',
        expect.objectContaining({
          status: 'FAILED',
          attempts: 6,
          lastStatusCode: null,
          lastError: 'Error: connect ECONNREFUSED',
        }),
      );
      expect(result).toEqual({ attempted: 1, delivered: 0, failed: 1 });
    });
  });

  describe('deliverDue destination and app checks', () => {
    const now = new Date('2026-10-09T12:00:00.000Z');

    it.each([
      ['a private address', '10.0.0.7'],
      ['the cloud metadata address', '169.254.169.254'],
      ['an IPv4-mapped loopback', '::ffff:127.0.0.1'],
    ])('marks the delivery FAILED as a blocked destination when the host resolves to %s, without sending', async (_n, address) => {
      const delivery = deliveryOf();
      claimDue.mockResolvedValue([delivery]);
      findTargets.mockResolvedValue([
        { delivery, url: 'https://shop.example.com/hooks', signingKey: keys.privateKey, appActive: true },
      ]);
      lookupMock.mockResolvedValue([{ address, family: address.includes(':') ? 6 : 4 }]);

      const result = await service.deliverDue(ORG, now);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith(
        'del-1',
        expect.objectContaining({ status: 'FAILED', attempts: 1, lastError: 'Blocked destination' }),
      );
      expect(result).toEqual({ attempted: 1, delivered: 0, failed: 1 });
    });

    it('marks the delivery FAILED as App inactive for a revoked or deactivated app, without sending', async () => {
      const delivery = deliveryOf();
      claimDue.mockResolvedValue([delivery]);
      findTargets.mockResolvedValue([
        { delivery, url: 'https://shop.example.com/hooks', signingKey: keys.privateKey, appActive: false },
      ]);

      await service.deliverDue(ORG, now);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(lookupMock).not.toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith(
        'del-1',
        expect.objectContaining({ status: 'FAILED', lastError: 'App inactive' }),
      );
    });
  });

  describe('redeliver', () => {
    it('requeues the delivery with a fresh retry budget', async () => {
      findForApp.mockResolvedValue(deliveryOf({ status: 'FAILED', attempts: 6 }));
      requeueIfIdle.mockResolvedValue(true);

      await expect(service.redeliver(ORG, APP, 'del-1')).resolves.toEqual({ deliveryId: 'del-1' });
      expect(requeueIfIdle).toHaveBeenCalledWith('del-1', expect.any(Date));
    });

    it('refuses with 409 Delivery In Progress while the delivery is leased or in flight', async () => {
      findForApp.mockResolvedValue(deliveryOf({ status: 'PENDING', nextAttemptAt: new Date(Date.now() + 60_000) }));
      requeueIfIdle.mockResolvedValue(false);

      const error = await service.redeliver(ORG, APP, 'del-1').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(((error as ConflictException).getResponse() as { label: string }).label).toBe('Delivery In Progress');
    });

    it('is a 404 for a delivery of another app', async () => {
      findForApp.mockResolvedValue(undefined);

      await expect(service.redeliver(ORG, APP, 'del-x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
