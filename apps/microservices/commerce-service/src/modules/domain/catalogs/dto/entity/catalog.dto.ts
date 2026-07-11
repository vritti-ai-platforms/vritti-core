import type { Catalog } from '@/db/schema';

export class CatalogDto {
  id: string;
  siteId: string;
  name: string;
  currencyCode: string;
  taxInclusive: boolean;
  isActive: boolean;
  channelCount: number;
  createdAt: string;
  updatedAt: string;

  static from(entity: Catalog, channelCount = 0): CatalogDto {
    const dto = new CatalogDto();
    dto.id = entity.id;
    dto.siteId = entity.siteId;
    dto.name = entity.name;
    dto.currencyCode = entity.currencyCode;
    dto.taxInclusive = entity.taxInclusive;
    dto.isActive = entity.isActive;
    dto.channelCount = channelCount;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
