import type { Catalog } from '@/db/schema';

export type CatalogOwnerScope = 'ORG' | 'LE' | 'SITE';

export class CatalogDto {
  id: string;
  name: string;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: CatalogOwnerScope;
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
    dto.legalEntityId = entity.legalEntityId ?? null;
    dto.siteId = entity.siteId ?? null;
    dto.ownerScope = entity.siteId ? 'SITE' : entity.legalEntityId ? 'LE' : 'ORG';
    dto.taxInclusive = entity.taxInclusive;
    dto.isActive = entity.isActive;
    dto.listingCount = counts?.items ?? 0;
    dto.channelCount = counts?.channels ?? 0;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
