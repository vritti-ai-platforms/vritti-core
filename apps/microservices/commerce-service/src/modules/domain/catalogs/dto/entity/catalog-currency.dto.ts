export interface CatalogCurrencyCoverageRow {
  currencyCode: string;
  sortOrder: number;
  pricedCount: number;
}

export class CatalogCurrencyDto {
  currencyCode: string;
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
