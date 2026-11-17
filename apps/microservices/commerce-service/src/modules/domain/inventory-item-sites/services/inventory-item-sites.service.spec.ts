import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { InventoryItemSite } from '@/db/schema';
import type { ReplenishmentDto } from '../dto/request/replenishment.dto';
import {
  InventoryItemSitesDomainRepository,
  type SiteItemCounts,
  type SiteItemUsage,
} from '../repositories/inventory-item-sites.repository';
import { InventoryItemSitesDomainService } from './inventory-item-sites.service';

beforeAll(() => Logger.overrideLogger(false));

// The repository's guards over a stubbed count: how many of the requested items the site carries and has blocked
function guards(counts: SiteItemCounts) {
  return Object.assign(Object.create(InventoryItemSitesDomainRepository.prototype), {
    countAtSite: jest.fn().mockResolvedValue(counts),
  }) as InventoryItemSitesDomainRepository;
}

const reorder = (overrides: Partial<ReplenishmentDto> = {}): ReplenishmentDto => ({
  inventoryItemId: 'item-1',
  replenishment: 'REORDER_POINT',
  safetyStock: 10,
  reorderPoint: 20,
  maxStock: 60,
  ...overrides,
});

describe('InventoryItemSitesDomainRepository guards', () => {
  it('accepts items the site carries', async () => {
    await expect(
      guards({ requested: 1, carried: 1, blocked: 0 }).ensureAtSite(['item-1'], 'items', 'site-1'),
    ).resolves.toBeUndefined();
  });

  it('refuses on the given field when the site does not carry every item', async () => {
    await expect(
      guards({ requested: 2, carried: 1, blocked: 0 }).ensureAtSite(['a', 'b'], 'items', 'site-1'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Not at Site',
        errors: [{ field: 'items', message: 'Not carried at this site' }],
      }),
    });
  });

  it('refuses purchasing a blocked item, but not stocking it', async () => {
    const repository = guards({ requested: 1, carried: 1, blocked: 1 });
    await expect(repository.ensureAtSite(['item-1'], 'items')).resolves.toBeUndefined();
    await expect(repository.ensurePurchasable(['item-1'], 'items')).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Purchasing Blocked',
      }),
    });
  });
});

describe('InventoryItemSitesDomainService.replenishmentOf', () => {
  const service = new InventoryItemSitesDomainService({} as InventoryItemSitesDomainRepository);

  it('keeps no levels for manual replenishment', () => {
    expect(service.replenishmentOf(reorder({ replenishment: 'MANUAL' }), true)).toEqual({
      replenishment: 'MANUAL',
      safetyStock: null,
      reorderPoint: null,
      maxStock: null,
    });
  });

  it('keeps stacked levels for a reorder point, an empty safety stock as null', () => {
    expect(service.replenishmentOf(reorder({ safetyStock: undefined }), true)).toEqual({
      replenishment: 'REORDER_POINT',
      safetyStock: null,
      reorderPoint: 20,
      maxStock: 60,
    });
  });

  it('refuses fractional levels in a unit that cannot be split, and keeps them in one that can', () => {
    expect(() => service.replenishmentOf(reorder({ reorderPoint: 20.5 }), false)).toThrow(BadRequestException);
    expect(service.replenishmentOf(reorder({ reorderPoint: 20.5 }), true)).toMatchObject({ reorderPoint: 20.5 });
  });

  it('refuses a reorder point of 0, a maximum below it and a safety stock above it', () => {
    expect(() => service.replenishmentOf(reorder({ reorderPoint: 0 }), true)).toThrow(BadRequestException);
    expect(() => service.replenishmentOf(reorder({ maxStock: 15 }), true)).toThrow(BadRequestException);
    expect(() => service.replenishmentOf(reorder({ safetyStock: 25 }), true)).toThrow(BadRequestException);
    expect(() => service.replenishmentOf(reorder({ maxStock: null }), true)).toThrow(BadRequestException);
  });
});

describe('InventoryItemSitesDomainService.delete', () => {
  const siteItem = { id: 'site-item-1', inventoryItemId: 'item-1', siteId: 'site-1' } as InventoryItemSite;
  const unused: SiteItemUsage = {
    onHand: 0,
    openPurchaseNumbers: [],
    draftAdjustmentCodes: [],
    draftReceiptNumbers: [],
    incomingTransferCount: 0,
  };

  // A service over a repository that finds the site item and reports the given usage of it
  function serviceWith(usage: Partial<SiteItemUsage>) {
    const repository = {
      findAtSiteOrThrow: jest.fn().mockResolvedValue(siteItem),
      findUsage: jest.fn().mockResolvedValue({ ...unused, ...usage }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    return {
      service: new InventoryItemSitesDomainService(repository as unknown as InventoryItemSitesDomainRepository),
      repository,
    };
  }

  it('removes an item nothing ties to the site any more', async () => {
    const { service, repository } = serviceWith({});
    await expect(service.delete({ inventoryItemId: 'item-1' })).resolves.toMatchObject({ success: true });
    expect(repository.delete).toHaveBeenCalledWith('site-item-1');
  });

  it('refuses while a draft document or an incoming transfer could still bring stock of it', async () => {
    const { service, repository } = serviceWith({
      draftAdjustmentCodes: ['ADJ-7'],
      draftReceiptNumbers: ['GR-3', 'GR-4'],
      incomingTransferCount: 1,
    });
    await expect(service.delete({ inventoryItemId: 'item-1' })).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Item Still in Use at Site',
        detail:
          'It is on draft stock adjustment "ADJ-7". It is on draft goods receipts "GR-3", "GR-4". It has 1 stock transfer still to be received here.',
      }),
    });
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
