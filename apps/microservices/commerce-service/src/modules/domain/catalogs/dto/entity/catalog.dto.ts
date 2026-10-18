import type { Catalog } from '@/db/schema';
import { type WorkspaceScope, workspaceScopeOf } from '@/db/schema';

export class CatalogDto {
  id: string;
  name: string;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: WorkspaceScope;
  taxInclusive: boolean;
  isActive: boolean;
  listingCount: number;
  channelCount: number;
  canEdit: boolean;
  // The currencies this price list may be priced in, in the order they are offered
  currencyCodes: string[];
  createdAt: string;
  updatedAt: string;

  static from(
    entity: Catalog,
    counts?: { items?: number; channels?: number; isOwned?: boolean },
    currencyCodes: string[] = [],
  ): CatalogDto {
    const dto = new CatalogDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.legalEntityId = entity.legalEntityId ?? null;
    dto.siteId = entity.siteId ?? null;
    dto.ownerScope = workspaceScopeOf(entity);
    dto.taxInclusive = entity.taxInclusive;
    dto.isActive = entity.isActive;
    dto.listingCount = counts?.items ?? 0;
    dto.channelCount = counts?.channels ?? 0;
    dto.canEdit = counts?.isOwned ?? false;
    dto.currencyCodes = currencyCodes;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
