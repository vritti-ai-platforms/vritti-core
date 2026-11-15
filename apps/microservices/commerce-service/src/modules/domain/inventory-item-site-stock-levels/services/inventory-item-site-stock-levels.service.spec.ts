import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import type { InventoryItemSiteStockLevelsDomainRepository } from '../repositories/inventory-item-site-stock-levels.repository';
import { InventoryItemSiteStockLevelsDomainService } from './inventory-item-site-stock-levels.service';

beforeAll(() => Logger.overrideLogger(false));

function serviceWith(names: string[]) {
  const repository = { findNamesWithoutStockLevels: jest.fn().mockResolvedValue(names) };
  return new InventoryItemSiteStockLevelsDomainService(
    repository as unknown as InventoryItemSiteStockLevelsDomainRepository,
  );
}

describe('InventoryItemSiteStockLevelsDomainService.ensureStockLevels', () => {
  it('accepts items with stock levels at the site', async () => {
    await expect(serviceWith([]).ensureStockLevels(['item-1'], 'items', 'site-1')).resolves.toBeUndefined();
  });

  it('names every item without stock levels at the site on the given field', async () => {
    await expect(
      serviceWith(['Paracetamol', 'Ibuprofen']).ensureStockLevels(['a', 'b'], 'items', 'site-1'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        label: 'No Stock Levels',
        detail:
          'Set stock levels for "Paracetamol", "Ibuprofen" at this site before buying, receiving or stocking it here.',
        errors: [{ field: 'items', message: 'No stock levels at this site' }],
      }),
    });
  });
});
