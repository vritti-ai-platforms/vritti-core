import type { Catalog } from '@/db/schema';

export class CatalogDto {
  id: string;
  name: string;
  ownerLegalEntityId: string | null;
  taxInclusive: boolean;
  isActive: boolean;
  listingCount: number;
  channelCount: number;
  createdAt: string;
  updatedAt: string;

  static from(entity: Catalog, counts?: { items?: number; channels?: number }): CatalogDto {
    const dto = new CatalogDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.ownerLegalEntityId = entity.ownerLegalEntityId ?? null;
    dto.taxInclusive = entity.taxInclusive;
    dto.isActive = entity.isActive;
    dto.listingCount = counts?.items ?? 0;
    dto.channelCount = counts?.channels ?? 0;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
