import type { SupplierItemCounts } from '../../repositories/supplier-items.repository';

export class SupplierItemCountsDto {
  siteItemCount: number;
  priceCount: number;

  // Shapes how many sites and prices a supplier item has, one per tab
  static from(row: SupplierItemCounts): SupplierItemCountsDto {
    const dto = new SupplierItemCountsDto();
    dto.siteItemCount = row.siteItemCount;
    dto.priceCount = row.priceCount;
    return dto;
  }
}
