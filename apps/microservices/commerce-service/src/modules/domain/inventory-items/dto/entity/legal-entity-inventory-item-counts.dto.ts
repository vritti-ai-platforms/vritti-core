import type { LegalEntityInventoryItemCounts } from '../../repositories/inventory-items.repository';

export class LegalEntityInventoryItemCountsDto {
  supplierCount: number;
  mrpCount: number;

  // Shapes how many suppliers and MRPs an inventory item has, one per tab of a legal entity's detail page
  static from(row: LegalEntityInventoryItemCounts): LegalEntityInventoryItemCountsDto {
    const dto = new LegalEntityInventoryItemCountsDto();
    dto.supplierCount = row.supplierCount;
    dto.mrpCount = row.mrpCount;
    return dto;
  }
}
