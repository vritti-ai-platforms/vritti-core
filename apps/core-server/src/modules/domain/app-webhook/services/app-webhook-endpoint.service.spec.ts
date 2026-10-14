import { lookup } from 'node:dns/promises';
import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { AppWebhookEndpointDomainRepository } from '../repositories/app-webhook-endpoint.repository';
import { AppWebhookEndpointDomainService } from './app-webhook-endpoint.service';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));

const lookupMock = lookup as unknown as jest.Mock;

describe('AppWebhookEndpointDomainService', () => {
  const upsert = jest.fn();
  const deleteByApp = jest.fn();
  const env: Record<string, string | undefined> = {};
  const service = new AppWebhookEndpointDomainService(
    { upsert, deleteByApp } as unknown as AppWebhookEndpointDomainRepository,
    { get: (key: string) => env[key] } as unknown as ConfigService,
  );
  const events = ['payment_intent.succeeded'];

  beforeEach(() => {
    jest.resetAllMocks();
    for (const key of Object.keys(env)) delete env[key];
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  afterEach(() => jest.restoreAllMocks());

  it('saves a public https endpoint', async () => {
    const now = new Date();
    upsert.mockResolvedValue({
      id: 'ep-1',
      appId: 'app-1',
      url: 'https://shop.example.com/hooks',
      events,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await service.upsert('org-1', 'app-1', {
      url: 'https://shop.example.com/hooks',
      events,
      isActive: true,
    });

    expect(upsert).toHaveBeenCalledWith('org-1', 'app-1', {
      url: 'https://shop.example.com/hooks',
      events,
      isActive: true,
    });
    expect(saved).toMatchObject({ id: 'ep-1', url: 'https://shop.example.com/hooks', isActive: true });
  });

  it.each([
    'http://shop.example.com/hooks',
    'https://10.0.0.5/hooks',
    'https://[::1]/hooks',
    'https://localhost/hooks',
    'https://printer.local/hooks',
    'https://payments.default.svc/hooks',
    'https://api.cluster.local/hooks',
    'https://metadata.google.internal/hooks',
    'https://user:pass@shop.example.com/hooks',
    'not a url',
  ])('rejects %s', async (url) => {
    await expect(service.upsert('org-1', 'app-1', { url, events, isActive: true })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it.each([
    ['a private IPv4 address', [{ address: '10.1.2.3', family: 4 }]],
    ['loopback', [{ address: '127.0.0.1', family: 4 }]],
    ['link-local metadata', [{ address: '169.254.169.254', family: 4 }]],
    ['CGNAT', [{ address: '100.64.0.9', family: 4 }]],
    ['an IPv6 ULA', [{ address: 'fd00::1', family: 6 }]],
    ['IPv6 link-local', [{ address: 'fe80::1', family: 6 }]],
    ['IPv4-mapped private', [{ address: '::ffff:192.168.1.1', family: 6 }]],
    [
      'one private among public addresses',
      [
        { address: '93.184.216.34', family: 4 },
        { address: '172.16.0.1', family: 4 },
      ],
    ],
  ])('rejects a host name that resolves to %s', async (_name, addresses) => {
    lookupMock.mockResolvedValue(addresses);

    const error = await service
      .upsert('org-1', 'app-1', { url: 'https://shop.example.com/hooks', events, isActive: true })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BadRequestException);
    expect(lookupMock).toHaveBeenCalledWith('shop.example.com', { all: true, verbatim: true });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('rejects a host name that does not resolve', async () => {
    lookupMock.mockRejectedValue(Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' }));

    await expect(
      service.upsert('org-1', 'app-1', { url: 'https://nowhere.example.com/hooks', events, isActive: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('is a 404 when there is no endpoint to delete', async () => {
    deleteByApp.mockResolvedValue(0);

    await expect(service.delete('org-1', 'app-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('with WEBHOOK_ALLOW_PRIVATE_DESTINATIONS (local development)', () => {
    const local = 'http://localhost:3000/api/vap/webhooks';

    function savedRow(url: string) {
      const now = new Date();
      return { id: 'ep-1', appId: 'app-1', url, events, isActive: true, createdAt: now, updatedAt: now };
    }

    it('saves a local http endpoint without resolving it', async () => {
      env.NODE_ENV = 'development';
      env.WEBHOOK_ALLOW_PRIVATE_DESTINATIONS = 'true';
      upsert.mockResolvedValue(savedRow(local));

      const saved = await service.upsert('org-1', 'app-1', { url: local, events, isActive: true });

      expect(saved.url).toBe(local);
      expect(lookupMock).not.toHaveBeenCalled();
    });

    it('refuses a private endpoint when the setting is off', async () => {
      env.NODE_ENV = 'development';

      await expect(service.upsert('org-1', 'app-1', { url: local, events, isActive: true })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(upsert).not.toHaveBeenCalled();
    });

    it('still refuses a URL that is not http or https', async () => {
      env.NODE_ENV = 'development';
      env.WEBHOOK_ALLOW_PRIVATE_DESTINATIONS = 'true';

      await expect(
        service.upsert('org-1', 'app-1', { url: 'ftp://localhost/hooks', events, isActive: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
