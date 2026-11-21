import type { SupplierCounts } from '../../repositories/suppliers.repository';

export class SupplierCountsDto {
  itemCount: number;
  quotationCount: number;
  personCount: number;

  // Shapes how many items, quotations and party people a supplier has, one per tab
  static from(row: SupplierCounts): SupplierCountsDto {
    const dto = new SupplierCountsDto();
    dto.itemCount = row.itemCount;
    dto.quotationCount = row.quotationCount;
    dto.personCount = row.personCount;
    return dto;
  }
}
