import type { OrgInventoryItemCounts } from '../../repositories/inventory-items.repository';

export class OrgInventoryItemCountsDto {
  conversionCount: number;
  mrpCount: number;
  supplierCount: number;

  // Shapes how many UOM conversions, MRPs and suppliers an inventory item has, one per tab of the org's detail page
  static from(row: OrgInventoryItemCounts): OrgInventoryItemCountsDto {
    const dto = new OrgInventoryItemCountsDto();
    dto.conversionCount = row.conversionCount;
    dto.mrpCount = row.mrpCount;
    dto.supplierCount = row.supplierCount;
    return dto;
  }
}
