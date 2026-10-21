import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { PayoutAccount, PayoutChannel } from '@/db/schema';
import type { PayoutChannelDetail, PayoutChannelDomainRepository } from '../repositories/payout-channel.repository';
import { PayoutChannelDomainService } from './payout-channel.service';

const ORG = 'org-1';
const LE = 'le-1';

const channel = (overrides: Partial<PayoutChannel> = {}): PayoutChannel => ({
  id: 'pc-1',
  organizationId: ORG,
  payoutAccountId: 'pa-1',
  legalEntityId: LE,
  siteId: null,
  appId: null,
  channel: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

const account = (id: string, overrides: Partial<PayoutAccount> = {}): PayoutAccount => ({
  id,
  organizationId: ORG,
  legalEntityId: LE,
  bankAccountId: 'bank-1',
  paymentGatewayConfigId: 'cfg-1',
  gatewayAccountId: `acc_${id}`,
  isMainAccount: false,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

const detail = (overrides: Partial<PayoutChannel> = {}): PayoutChannelDetail => ({
  ...channel(overrides),
  account: { id: 'pa-1', gatewayAccountId: 'acc_1', isMainAccount: false, paymentGatewayConfigId: 'cfg-1' },
  gateway: { id: 'cfg-1', kind: 'PLATFORM', gatewayCode: 'razorpay', label: 'Vritti Razorpay' },
  bank: { id: 'bank-1', label: null, bankName: 'HDFC Bank', accountNumber: '50100012341234' },
});

describe('PayoutChannelDomainService', () => {
  const repository = {
    findDetailedByLegalEntity: jest.fn(),
    findDetailedById: jest.fn(),
    findInScopeForGateway: jest.fn(),
    findCandidates: jest.fn(),
    countByPayoutAccount: jest.fn(),
    lockLegalEntity: jest.fn(),
    transaction: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const service = new PayoutChannelDomainService(repository as unknown as PayoutChannelDomainRepository);
  const target = { id: 'pa-1', legalEntityId: LE, paymentGatewayConfigId: 'cfg-1' };

  beforeEach(() => {
    jest.resetAllMocks();
    repository.transaction.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    repository.findInScopeForGateway.mockResolvedValue(undefined);
  });

  describe('create', () => {
    it("locks the legal entity, then stores the scope on the account's legal entity", async () => {
      repository.create.mockResolvedValue(channel({ siteId: 'site-1' }));
      repository.findDetailedById.mockResolvedValue(detail({ siteId: 'site-1' }));

      const result = await service.create(ORG, { payoutAccountId: 'pa-1', siteId: 'site-1' }, target);

      expect(repository.lockLegalEntity).toHaveBeenCalledWith(LE);
      expect(repository.lockLegalEntity.mock.invocationCallOrder[0]).toBeLessThan(
        repository.findInScopeForGateway.mock.invocationCallOrder[0],
      );
      expect(repository.create).toHaveBeenCalledWith({
        organizationId: ORG,
        payoutAccountId: 'pa-1',
        legalEntityId: LE,
        siteId: 'site-1',
        appId: null,
        channel: null,
      });
      expect(result.data).toMatchObject({
        siteId: 'site-1',
        payoutAccount: { bankAccount: { accountNumberLast4: '1234' } },
      });
    });

    it('refuses a scope that already pays out through the same gateway', async () => {
      repository.findInScopeForGateway.mockResolvedValue(channel());

      const error = await service.create(ORG, { payoutAccountId: 'pa-1' }, target).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(repository.findInScopeForGateway).toHaveBeenCalledWith(
        { legalEntityId: LE, siteId: null, appId: null, channel: null },
        'cfg-1',
        undefined,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('update and delete', () => {
    it("points a channel at another account, checking the new account's gateway for the same scope", async () => {
      repository.findDetailedById.mockResolvedValue(detail({ channel: 'POS' }));

      await service.update(ORG, 'pc-1', { id: 'pa-2', legalEntityId: LE, paymentGatewayConfigId: 'cfg-2' });

      expect(repository.findInScopeForGateway).toHaveBeenCalledWith(
        { legalEntityId: LE, siteId: null, appId: null, channel: 'POS' },
        'cfg-2',
        'pc-1',
      );
      expect(repository.update).toHaveBeenCalledWith('pc-1', { payoutAccountId: 'pa-2' });
    });

    it('hides a channel of another organization behind not found', async () => {
      repository.findDetailedById.mockResolvedValue(detail({ organizationId: 'other' }));

      await expect(service.delete(ORG, 'pc-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('resolve', () => {
    const context = { legalEntityId: LE, siteId: 'site-1', appId: 'app-1', channel: 'APP' as const };

    it("returns the most specific channel's payout account: app beats site beats channel beats the legal entity", async () => {
      repository.findCandidates.mockResolvedValue([
        { channel: channel({ id: 'le' }), account: account('le') },
        { channel: channel({ id: 'ch', channel: 'APP' }), account: account('ch') },
        { channel: channel({ id: 'st', siteId: 'site-1' }), account: account('st') },
        { channel: channel({ id: 'ap', appId: 'app-1', channel: 'APP' }), account: account('ap') },
      ]);

      await expect(service.resolve(ORG, context, 'cfg-1')).resolves.toMatchObject({ id: 'ap' });
      expect(repository.findCandidates).toHaveBeenCalledWith(context, 'cfg-1');
    });

    it('lets a site match beat a channel match', async () => {
      repository.findCandidates.mockResolvedValue([
        { channel: channel({ id: 'ch', channel: 'POS' }), account: account('ch') },
        { channel: channel({ id: 'st', siteId: 'site-1' }), account: account('st') },
      ]);

      await expect(service.resolve(ORG, { ...context, channel: 'POS' }, 'cfg-1')).resolves.toMatchObject({
        id: 'st',
      });
    });

    it('answers undefined when no channel fits', async () => {
      repository.findCandidates.mockResolvedValue([]);

      await expect(service.resolve(ORG, context, 'cfg-1')).resolves.toBeUndefined();
    });
  });

  it('lists each gateway with a fitting channel once', async () => {
    repository.findCandidates.mockResolvedValue([
      { channel: channel({ id: 'a' }), account: account('a') },
      { channel: channel({ id: 'b', channel: 'APP' }), account: account('b') },
      { channel: channel({ id: 'c' }), account: account('c', { paymentGatewayConfigId: 'cfg-2' }) },
    ]);

    await expect(service.findPayableConfigIds(ORG, { legalEntityId: LE, channel: 'APP' })).resolves.toEqual([
      'cfg-1',
      'cfg-2',
    ]);
  });
});
