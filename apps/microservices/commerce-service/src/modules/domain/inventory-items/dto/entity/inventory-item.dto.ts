import type { InventoryItem, InventoryItemType, InventoryPickStrategy, InventoryTracking } from '@/db/schema';

export class InventoryItemDto {
  id: string;
  name: string;
  code: string;
  type: InventoryItemType;
  tracking: InventoryTracking;
  pickStrategy: InventoryPickStrategy;
  categoryId: string;
  categoryName: string | null;
  description: string | null;
  uomId: string;
  uomSymbol: string | null;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(
    entity: InventoryItem,
    uomSymbol?: string | null,
    canDelete = true,
    categoryName?: string | null,
  ): InventoryItemDto {
    const dto = new InventoryItemDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.code = entity.code;
    dto.type = entity.type;
    dto.tracking = entity.tracking;
    dto.pickStrategy = entity.pickStrategy;
    dto.categoryId = entity.categoryId;
    dto.categoryName = categoryName ?? null;
    dto.description = entity.description ?? null;
    dto.uomId = entity.uomId;
    dto.uomSymbol = uomSymbol ?? null;
    dto.canDelete = canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
