import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { SupplierItemsDomainRepository } from '../repositories/supplier-items.repository';
import { SupplierItemsDomainService } from './supplier-items.service';

function setup(missingNames: string[] = []) {
  const findSiteUnits = jest.fn().mockResolvedValue([
    { inventoryItemId: 'item-1', uomId: 'strip' },
    { inventoryItemId: 'item-2', uomId: 'box' },
  ]);
  const findNamesNotSuppliedAt = jest.fn().mockResolvedValue(missingNames);
  const repository = { findSiteUnits, findNamesNotSuppliedAt } as unknown as SupplierItemsDomainRepository;
  const service = new SupplierItemsDomainService({} as PrimaryDatabaseService, repository);
  return { service, findSiteUnits, findNamesNotSuppliedAt };
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
    const { service, findSiteUnits, findNamesNotSuppliedAt } = setup();
    await expect(service.findSiteUnits('sup-1', 'site-1', [])).resolves.toEqual(new Map());
    await expect(service.assertSuppliedAt('sup-1', 'site-1', [], 'items')).resolves.toBeUndefined();
    expect(findSiteUnits).not.toHaveBeenCalled();
    expect(findNamesNotSuppliedAt).not.toHaveBeenCalled();
  });

  it('passes when the supplier supplies every item at the site', async () => {
    const { service } = setup();
    await expect(service.assertSuppliedAt('sup-1', 'site-1', ['item-1'], 'items')).resolves.toBeUndefined();
  });

  it('names the items the supplier does not supply at the site on the given field', async () => {
    const { service } = setup(['Paracetamol 500', 'Cetirizine 10']);
    await expect(
      service.assertSuppliedAt('sup-1', 'site-1', ['item-1', 'item-2'], 'inventoryItemId'),
    ).rejects.toMatchObject({
      status: 400,
      response: expect.objectContaining({
        label: 'Item Not Supplied at Site',
        detail: expect.stringContaining('"Paracetamol 500", "Cetirizine 10"'),
        errors: [{ field: 'inventoryItemId', message: 'Not supplied at this site' }],
      }),
    });
  });
});
