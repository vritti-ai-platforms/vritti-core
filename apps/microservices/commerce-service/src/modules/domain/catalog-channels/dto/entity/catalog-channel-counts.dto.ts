import type { CatalogChannelCounts } from '../../repositories/catalog-channels.repository';

export class CatalogChannelCountsDto {
  listingCount: number;
  currencyCount: number;

  // Shapes how many listings and currencies a channel carries, one per tab
  static from(row: CatalogChannelCounts): CatalogChannelCountsDto {
    const dto = new CatalogChannelCountsDto();
    dto.listingCount = row.listingCount;
    dto.currencyCount = row.currencyCount;
    return dto;
  }
}
