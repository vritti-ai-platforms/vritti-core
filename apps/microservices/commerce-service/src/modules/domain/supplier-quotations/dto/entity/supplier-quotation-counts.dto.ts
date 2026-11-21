import type { SupplierQuotationCounts } from '../../repositories/supplier-quotations.repository';

export class SupplierQuotationCountsDto {
  itemCount: number;
  siteCount: number;

  // Shapes how many lines and postings a supplier quotation has, one per tab
  static from(row: SupplierQuotationCounts): SupplierQuotationCountsDto {
    const dto = new SupplierQuotationCountsDto();
    dto.itemCount = row.itemCount;
    dto.siteCount = row.siteCount;
    return dto;
  }
}
