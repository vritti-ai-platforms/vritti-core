import type { InventoryItem, InventoryItemType, InventoryPickStrategy, InventoryTracking } from '@/db/schema';

export class InventoryItemDto {
  id: string;
  name: string;
  sku: string;
  type: InventoryItemType;
  tracking: InventoryTracking;
  pickStrategy: InventoryPickStrategy;
  categoryId: string;
  categoryName: string | null;
  description: string | null;
  uomId: string;
  uomSymbol: string | null;
  hsnCode: string | null;
  taxClassId: string;
  taxClassName: string | null;
  weight: number | null;
  volume: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(
    entity: InventoryItem,
    uomSymbol?: string | null,
    canDelete = true,
    categoryName?: string | null,
    taxClassName?: string | null,
  ): InventoryItemDto {
    const dto = new InventoryItemDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.sku = entity.sku;
    dto.type = entity.type;
    dto.tracking = entity.tracking;
    dto.pickStrategy = entity.pickStrategy;
    dto.categoryId = entity.categoryId;
    dto.categoryName = categoryName ?? null;
    dto.description = entity.description ?? null;
    dto.uomId = entity.uomId;
    dto.uomSymbol = uomSymbol ?? null;
    dto.hsnCode = entity.hsnCode ?? null;
    dto.taxClassId = entity.taxClassId;
    dto.taxClassName = taxClassName ?? null;
    dto.weight = entity.weight ?? null;
    dto.volume = entity.volume ?? null;
    dto.length = entity.length ?? null;
    dto.width = entity.width ?? null;
    dto.height = entity.height ?? null;
    dto.canDelete = canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
