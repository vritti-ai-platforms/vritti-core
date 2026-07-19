import type { SupplierItemSite } from '@/db/schema';

export class SupplierItemSiteDto {
  id: string;
  supplierItemId: string;
  siteId: string;
  leadTimeDays: number | null;
  minOrderQuantity: number | null;
  createdAt: string;
  updatedAt: string;

  // Maps a SupplierItemSite entity to a SupplierItemSiteDto
  static from(entity: SupplierItemSite): SupplierItemSiteDto {
    const dto = new SupplierItemSiteDto();
    dto.id = entity.id;
    dto.supplierItemId = entity.supplierItemId;
    dto.siteId = entity.siteId;
    dto.leadTimeDays = entity.leadTimeDays ?? null;
    dto.minOrderQuantity = entity.minOrderQuantity ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
