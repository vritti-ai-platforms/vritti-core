import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { SupplierItemsDomainRepository } from '../repositories/supplier-items.repository';
import { SupplierItemsDomainService } from './supplier-items.service';

function setup() {
  const findSiteUnits = jest.fn().mockResolvedValue([
    { inventoryItemId: 'item-1', uomId: 'strip' },
    { inventoryItemId: 'item-2', uomId: 'box' },
  ]);
  // The legal entity has set item-1 up for the supplier in strips only
  const findSetUpKeys = jest.fn().mockResolvedValue([{ inventoryItemId: 'item-1', uomId: 'strip' }]);
  const repository = { findSiteUnits, findSetUpKeys } as unknown as SupplierItemsDomainRepository;
  const service = new SupplierItemsDomainService({} as PrimaryDatabaseService, repository);
  return { service, findSiteUnits, findSetUpKeys };
}

beforeAll(() => Logger.overrideLogger(false));

describe('SupplierItemsDomainService at a site', () => {
  it('maps each supplied item to the unit the supplier sells it in there, asking once per item', async () => {
    const { service, findSiteUnits } = setup();
    const units = await service.findSiteUnits('sup-1', 'site-1', ['item-1', 'item-2', 'item-1', 'item-3']);
    expect(findSiteUnits).toHaveBeenCalledWith('sup-1', 'site-1', ['item-1', 'item-2', 'item-3']);
    expect([...units]).toEqual([
      ['item-1', 'strip'],
      ['item-2', 'box'],
    ]);
  });

  it('skips the query for no items', async () => {
    const { service, findSiteUnits, findSetUpKeys } = setup();
    await expect(service.findSiteUnits('sup-1', 'site-1', [])).resolves.toEqual(new Map());
    await expect(service.assertSetUp('sup-1', [], 'items')).resolves.toBeUndefined();
    expect(findSiteUnits).not.toHaveBeenCalled();
    expect(findSetUpKeys).not.toHaveBeenCalled();
  });
});

describe('SupplierItemsDomainService.assertSetUp', () => {
  it("passes an item set up as one of the supplier's items, in the line's unit or in any", async () => {
    const { service } = setup();
    await expect(
      service.assertSetUp(
        'sup-1',
        [{ inventoryItemId: 'item-1', uomId: 'strip' }, { inventoryItemId: 'item-1' }],
        'items',
      ),
    ).resolves.toBeUndefined();
  });

  it('refuses an item the supplier has only in another unit', async () => {
    const { service } = setup();
    await expect(
      service.assertSetUp('sup-1', [{ inventoryItemId: 'item-1', uomId: 'box' }], 'uomId'),
    ).rejects.toMatchObject({
      status: 400,
      response: expect.objectContaining({ label: 'Not Set Up For Supplier' }),
    });
  });

  it("refuses on the given field an item that is not one of the supplier's items", async () => {
    const { service } = setup();
    await expect(
      service.assertSetUp('sup-1', [{ inventoryItemId: 'item-2' }], 'inventoryItemId'),
    ).rejects.toMatchObject({
      status: 400,
      response: expect.objectContaining({
        errors: [{ field: 'inventoryItemId', message: "Not one of the supplier's items" }],
      }),
    });
  });
});
