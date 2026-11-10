import type { SupplierSiteItem } from '@/db/schema';

export class SupplierSiteItemDto {
  id: string;
  supplierItemId: string;
  legalEntityId: string;
  siteId: string;
  inventoryItemId: string;
  isPreferred: boolean;
  leadTimeDays: number;
  // True when the site sets its own lead time instead of following the supplier item's
  isLeadTimeOverridden: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a SupplierSiteItem entity to a SupplierSiteItemDto
  static from(entity: SupplierSiteItem): SupplierSiteItemDto {
    const dto = new SupplierSiteItemDto();
    dto.id = entity.id;
    dto.supplierItemId = entity.supplierItemId;
    dto.legalEntityId = entity.legalEntityId;
    dto.siteId = entity.siteId;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.isPreferred = entity.isPreferred;
    dto.leadTimeDays = entity.leadTimeDays;
    dto.isLeadTimeOverridden = entity.isLeadTimeOverridden;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
