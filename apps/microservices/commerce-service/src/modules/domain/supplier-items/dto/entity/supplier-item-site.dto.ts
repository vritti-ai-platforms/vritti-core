import type { SupplierItemSite } from '@/db/schema';

export class SupplierItemSiteDto {
  id: string;
  supplierItemId: string;
  legalEntityId: string;
  siteId: string;
  inventoryItemId: string;
  isPreferred: boolean;
  leadTimeDays: number | null;
  // True when the site sets its own lead time instead of following the supplier item's
  isLeadTimeOverridden: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a SupplierItemSite entity to a SupplierItemSiteDto
  static from(entity: SupplierItemSite): SupplierItemSiteDto {
    const dto = new SupplierItemSiteDto();
    dto.id = entity.id;
    dto.supplierItemId = entity.supplierItemId;
    dto.legalEntityId = entity.legalEntityId;
    dto.siteId = entity.siteId;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.isPreferred = entity.isPreferred;
    dto.leadTimeDays = entity.leadTimeDays ?? null;
    dto.isLeadTimeOverridden = entity.isLeadTimeOverridden;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
