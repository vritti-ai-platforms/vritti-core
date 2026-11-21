import type { CatalogCounts } from '../../repositories/catalogs.repository';

export class CatalogCountsDto {
  channelCount: number;
  listingCount: number;
  currencyCount: number;

  // Shapes how many channels, listings and currencies a catalog has, one per tab
  static from(row: CatalogCounts): CatalogCountsDto {
    const dto = new CatalogCountsDto();
    dto.channelCount = row.channelCount;
    dto.listingCount = row.listingCount;
    dto.currencyCount = row.currencyCount;
    return dto;
  }
}
