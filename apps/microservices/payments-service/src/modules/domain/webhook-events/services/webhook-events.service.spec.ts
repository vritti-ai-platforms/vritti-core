import { InternalServerErrorException } from '@vritti/api-sdk/exceptions';
import type { WebhookEventsDomainRepository } from '../repositories/webhook-events.repository';
import { WebhookEventsDomainService } from './webhook-events.service';

const input = {
  organizationId: 'org-1',
  configId: 'pgc-1',
  gatewayCode: 'razorpay',
  rawBody: '{"event":"payment.captured"}',
  events: [{ dedupeKey: 'hash-1', providerEventId: 'evt_1', eventType: 'payment.captured', payload: {} }],
};

describe('WebhookEventsDomainService', () => {
  const insertIfNew = jest.fn();
  const findByDedupeKey = jest.fn();
  const markProcessed = jest.fn();
  const repository = { insertIfNew, findByDedupeKey, markProcessed } as unknown as WebhookEventsDomainRepository;
  const service = new WebhookEventsDomainService(repository);

  beforeEach(() => jest.resetAllMocks());

  it('stores a first delivery as RECEIVED and does not mark it processed', async () => {
    insertIfNew.mockResolvedValue({ id: 'we-1', status: 'RECEIVED' });

    const recorded = await service.record(input);

    expect(insertIfNew).toHaveBeenCalledWith(
      expect.objectContaining({ dedupeKey: 'hash-1', providerEventId: 'evt_1', status: 'RECEIVED' }),
    );
    expect(markProcessed).not.toHaveBeenCalled();
    expect(recorded).toEqual([{ id: 'we-1', inserted: true, status: 'RECEIVED' }]);
  });

  it('reports a repeat delivery as the stored row with its status, not inserted', async () => {
    insertIfNew.mockResolvedValue(undefined);
    findByDedupeKey.mockResolvedValue({ id: 'we-1', status: 'FAILED' });

    const recorded = await service.record(input);

    expect(findByDedupeKey).toHaveBeenCalledWith('razorpay', 'hash-1');
    expect(recorded).toEqual([{ id: 'we-1', inserted: false, status: 'FAILED' }]);
  });

  it('refuses when the insert conflicted yet the stored row is not visible', async () => {
    insertIfNew.mockResolvedValue(undefined);
    findByDedupeKey.mockResolvedValue(undefined);

    await expect(service.record(input)).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
