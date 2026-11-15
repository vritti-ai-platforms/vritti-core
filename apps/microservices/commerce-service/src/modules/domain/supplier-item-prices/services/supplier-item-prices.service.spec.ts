import 'reflect-metadata';
import type { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { ItemSupplierPriceComparisonsRepository } from '../repositories/item-supplier-price-comparisons.repository';
import type { SupplierItemPricesDomainRepository } from '../repositories/supplier-item-prices.repository';
import { SupplierItemPricesDomainService } from './supplier-item-prices.service';

describe('SupplierItemPricesDomainService.resolvePriceForOrderLine', () => {
  it('returns the price row the repository resolves for the site on the date, without the price context check', async () => {
    const price = { id: 'price-1', schemeBuyQty: 10, schemeFreeQty: 1 };
    const repository = { resolvePrice: jest.fn().mockResolvedValue(price) };
    const service = new SupplierItemPricesDomainService(
      {} as PrimaryDatabaseService,
      repository as unknown as SupplierItemPricesDomainRepository,
      {} as ItemSupplierPriceComparisonsRepository,
    );
    await expect(service.resolvePriceForOrderLine('si-1', 'site-1', '2026-11-01')).resolves.toBe(price);
    expect(repository.resolvePrice).toHaveBeenCalledWith('si-1', 'site-1', '2026-11-01');
  });
});
