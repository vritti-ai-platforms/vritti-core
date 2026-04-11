import type { InventoryItem, InventoryItemType } from '@/db/schema';

export class InventoryItemDto {
  id: string;
  name: string;
  code: string;
  type: InventoryItemType;
  description: string | null;
  uomId: string;
  uomSymbol: string | null;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(entity: InventoryItem, uomSymbol?: string | null, canDelete = true): InventoryItemDto {
    const dto = new InventoryItemDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.code = entity.code;
    dto.type = entity.type;
    dto.description = entity.description ?? null;
    dto.uomId = entity.uomId;
    dto.uomSymbol = uomSymbol ?? null;
    dto.canDelete = canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
