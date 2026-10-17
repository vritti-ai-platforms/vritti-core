export interface CatalogCurrencyCoverageRow {
  currencyCode: string;
  sortOrder: number;
  pricedCount: number;
}

export class CatalogCurrencyDto {
  currencyCode: string;
  // Listings this workspace can quote in this currency, out of every listing in the catalog — the gap
  // is what a storefront asking for it finds unpriced
  pricedCount: number;
  listingCount: number;

  static from(row: CatalogCurrencyCoverageRow, listingCount: number): CatalogCurrencyDto {
    const dto = new CatalogCurrencyDto();
    dto.currencyCode = row.currencyCode;
    dto.pricedCount = row.pricedCount;
    dto.listingCount = listingCount;
    return dto;
  }
}
