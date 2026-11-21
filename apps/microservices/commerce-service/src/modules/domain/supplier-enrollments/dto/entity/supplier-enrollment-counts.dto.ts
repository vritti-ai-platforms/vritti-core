import type { SupplierSiteCountsRow } from '../../repositories/site-suppliers.repository';

export class SupplierEnrollmentCountsDto {
  siteItemCount: number;
  quotationCount: number;
  invoiceCount: number;

  // Shapes how many items, quotations and invoices a supplier has at a site, one per tab; an enrolled site lists the
  // items it carries, one not enrolled yet the supplier's whole catalog
  static from(row: SupplierSiteCountsRow): SupplierEnrollmentCountsDto {
    const dto = new SupplierEnrollmentCountsDto();
    dto.siteItemCount = row.enrollmentId ? row.carriedItemCount : row.itemCount;
    dto.quotationCount = row.quotationCount;
    dto.invoiceCount = row.invoiceCount;
    return dto;
  }
}
