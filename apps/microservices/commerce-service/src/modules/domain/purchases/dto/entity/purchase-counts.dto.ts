import type { PurchaseCountsRow } from '../../repositories/purchases.repository';

export class PurchaseCountsDto {
  itemCount: number;
  supplierCount: number;
  quotationCount: number;

  // Shapes how many item lines, suppliers and requested quotations a purchase has
  static from(row: PurchaseCountsRow, quotationCount: number): PurchaseCountsDto {
    const dto = new PurchaseCountsDto();
    dto.itemCount = row.itemCount;
    dto.supplierCount = row.supplierCount;
    dto.quotationCount = quotationCount;
    return dto;
  }
}
