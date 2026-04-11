import type { InventoryItem, InventoryItemType, InventoryLedgerEntry, InventoryLedgerType } from '@/db/schema';

export class InventoryLevelDto {
  id: string;
  locationId: string;
  locationName: string | null;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;

  static from(row: { id: string; locationId: string; locationName: string | null; stockedQuantity: string; reservedQuantity: string; reorderLevel: string }): InventoryLevelDto {
    const dto = new InventoryLevelDto();
    dto.id = row.id;
    dto.locationId = row.locationId;
    dto.locationName = row.locationName;
    dto.stockedQuantity = Number(row.stockedQuantity);
    dto.reservedQuantity = Number(row.reservedQuantity);
    dto.availableQuantity = Number(row.stockedQuantity) - Number(row.reservedQuantity);
    dto.reorderLevel = Number(row.reorderLevel);
    return dto;
  }
}

export class InventoryLedgerDto {
  id: string;
  type: InventoryLedgerType;
  quantity: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;

  static from(entity: InventoryLedgerEntry): InventoryLedgerDto {
    const dto = new InventoryLedgerDto();
    dto.id = entity.id;
    dto.type = entity.type;
    dto.quantity = Number(entity.quantity);
    dto.balanceAfter = Number(entity.balanceAfter);
    dto.referenceType = entity.referenceType ?? null;
    dto.referenceId = entity.referenceId ?? null;
    dto.notes = entity.notes ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}

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
