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
      guards({ requested: 1, carried: 1, blocked: 0 }).isAddedToSite(['item-1'], 'items', 'site-1'),
    ).resolves.toBeUndefined();
  });

  it('refuses on the given field when the site does not carry every item', async () => {
    await expect(
      guards({ requested: 2, carried: 1, blocked: 0 }).isAddedToSite(['a', 'b'], 'items', 'site-1'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Not at Site',
        errors: [{ field: 'items', message: 'Not carried at this site' }],
      }),
    });
  });

  it('refuses purchasing a blocked item, but not stocking it', async () => {
    const repository = guards({ requested: 1, carried: 1, blocked: 1 });
    await expect(repository.isAddedToSite(['item-1'], 'items')).resolves.toBeUndefined();
    await expect(repository.canPurchaseAtSite(['item-1'], 'items')).rejects.toMatchObject({
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

describe('InventoryItemSitesDomainService bulk actions', () => {
  // A service over a repository that reports the given items as addable and unblocks the given number of rows
  function serviceWith({ addable = [] as string[], blocked = 0, unblocked = 0 }) {
    const repository = {
      findAddableItemIds: jest.fn().mockResolvedValue(addable),
      createMany: jest.fn().mockImplementation((rows: unknown[]) => Promise.resolve(rows)),
      blockMany: jest.fn().mockResolvedValue(blocked),
      unblockMany: jest.fn().mockResolvedValue(unblocked),
    };
    return {
      service: new InventoryItemSitesDomainService(repository as unknown as InventoryItemSitesDomainRepository),
      repository,
    };
  }

  it('adds every selected item, each restocked manually', async () => {
    const { service, repository } = serviceWith({ addable: ['a', 'b'] });
    await expect(service.createMany({ inventoryItemIds: ['a', 'b', 'a'] })).resolves.toEqual({
      success: true,
      message: '2 items added to the site, restocked manually.',
    });
    expect(repository.findAddableItemIds).toHaveBeenCalledWith(['a', 'b'], undefined);
    expect(repository.createMany).toHaveBeenCalledWith([
      expect.objectContaining({ inventoryItemId: 'a', replenishment: 'MANUAL', reorderPoint: null, maxStock: null }),
      expect.objectContaining({ inventoryItemId: 'b', replenishment: 'MANUAL', reorderPoint: null, maxStock: null }),
    ]);
  });

  it('writes nothing while the site already carries any selected item', async () => {
    const { service, repository } = serviceWith({ addable: ['b'] });
    await expect(service.createMany({ inventoryItemIds: ['a', 'b'] })).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'Already Carried',
        detail:
          "1 selected item can't be added: the site already carries them or they no longer exist. Select only items it does not carry.",
      }),
    });
    expect(repository.createMany).not.toHaveBeenCalled();
  });

  it('blocks the carried items still allowed, with the trimmed reason, and counts the rest as skipped', async () => {
    const { service, repository } = serviceWith({ blocked: 2 });
    await expect(
      service.blockMany({ inventoryItemIds: ['a', 'b', 'c'], reason: '  Recalled batch ' }),
    ).resolves.toEqual({
      success: true,
      message: 'Purchasing blocked for 2 items. Skipped 1 item not carried here or already blocked.',
    });
    expect(repository.blockMany).toHaveBeenCalledWith(['a', 'b', 'c'], 'Recalled batch', undefined);
  });

  it('refuses when none of the items can be blocked', async () => {
    const { service } = serviceWith({ blocked: 0 });
    await expect(service.blockMany({ inventoryItemIds: ['a'], reason: 'Recalled' })).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Nothing to Block' }),
    });
  });

  it('allows purchasing of the blocked items and counts the rest as skipped', async () => {
    const { service, repository } = serviceWith({ unblocked: 1 });
    await expect(service.unblockMany({ inventoryItemIds: ['a', 'b', 'a'] })).resolves.toEqual({
      success: true,
      message: 'Purchasing allowed for 1 item. Skipped 1 item not blocked here.',
    });
    expect(repository.unblockMany).toHaveBeenCalledWith(['a', 'b'], undefined);
  });

  it('refuses when none of the items is blocked', async () => {
    const { service } = serviceWith({ unblocked: 0 });
    await expect(service.unblockMany({ inventoryItemIds: ['a'] })).rejects.toMatchObject({
      response: expect.objectContaining({ label: 'Not Blocked' }),
    });
  });
});
