import type { AppDomainRepository } from '@domain/app/repositories/app.repository';
import type { LegalEntityDomainRepository } from '@domain/legal-entity/repositories/legal-entity.repository';
import type { PayoutAccountDomainService } from '@domain/payout-account/services/payout-account.service';
import type { PayoutChannelDomainService } from '@domain/payout-channel/services/payout-channel.service';
import type { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { PayoutChannelService } from './payout-channel-api.service';

const ORG = 'org-1';
const LE = 'le-1';

interface Problem {
  errors: { field: string }[];
}

const problemOf = (error: unknown): Problem => (error as BadRequestException).getResponse() as Problem;

describe('PayoutChannelService', () => {
  const channels = {
    listForLegalEntity: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    requireById: jest.fn(),
    delete: jest.fn(),
  };
  const accounts = { requireById: jest.fn() };
  const legalEntities = { findById: jest.fn() };
  const sites = { findById: jest.fn() };
  const apps = { findByIdInOrg: jest.fn() };
  const service = new PayoutChannelService(
    channels as unknown as PayoutChannelDomainService,
    accounts as unknown as PayoutAccountDomainService,
    legalEntities as unknown as LegalEntityDomainRepository,
    sites as unknown as SiteDomainRepository,
    apps as unknown as AppDomainRepository,
  );
  const account = { id: 'pa-1', legalEntityId: LE, paymentGatewayConfigId: 'cfg-1' };

  beforeEach(() => {
    jest.resetAllMocks();
    accounts.requireById.mockResolvedValue(account);
    sites.findById.mockResolvedValue({ id: 'site-1', organizationId: ORG, legalEntityId: LE });
    apps.findByIdInOrg.mockResolvedValue({ id: 'app-1' });
    channels.create.mockResolvedValue({ success: true });
  });

  it("creates a channel on the payout account's legal entity", async () => {
    await service.create(ORG, { payoutAccountId: 'pa-1', siteId: 'site-1', channel: 'POS' });

    expect(channels.create).toHaveBeenCalledWith(
      ORG,
      { payoutAccountId: 'pa-1', siteId: 'site-1', channel: 'POS' },
      account,
    );
  });

  it('turns an unknown payout account into a 400 on payoutAccountId', async () => {
    accounts.requireById.mockRejectedValue(new NotFoundException('Payout account not found.'));

    const error = await service.create(ORG, { payoutAccountId: 'pa-x' }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BadRequestException);
    expect(problemOf(error).errors[0].field).toBe('payoutAccountId');
  });

  it("refuses a site of another legal entity than the account's, on siteId", async () => {
    sites.findById.mockResolvedValue({ id: 'site-1', organizationId: ORG, legalEntityId: 'le-2' });

    const error = await service.create(ORG, { payoutAccountId: 'pa-1', siteId: 'site-1' }).catch((e: unknown) => e);

    expect(problemOf(error).errors[0].field).toBe('siteId');
    expect(channels.create).not.toHaveBeenCalled();
  });

  it('refuses an app on any channel but APP, on channel', async () => {
    const error = await service
      .create(ORG, { payoutAccountId: 'pa-1', appId: 'app-1', channel: 'B2B' })
      .catch((e: unknown) => e);

    expect(problemOf(error).errors[0].field).toBe('channel');
  });

  it('maps the same account twice for one scope to 409', async () => {
    channels.create.mockRejectedValue({ cause: { code: '23505' } });

    await expect(service.create(ORG, { payoutAccountId: 'pa-1' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses moving a channel to a payout account of another legal entity', async () => {
    channels.requireById.mockResolvedValue({ id: 'pc-1', legalEntityId: LE });
    accounts.requireById.mockResolvedValue({ ...account, id: 'pa-2', legalEntityId: 'le-2' });

    const error = await service.update(ORG, 'pc-1', { payoutAccountId: 'pa-2' }).catch((e: unknown) => e);

    expect(problemOf(error).errors[0].field).toBe('payoutAccountId');
    expect(channels.update).not.toHaveBeenCalled();
  });
});
