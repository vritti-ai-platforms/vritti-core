import type { InventoryItem, InventoryItemType, InventoryLedgerEntry, InventoryLedgerType, InventoryLevel } from '@/db/schema';

export class InventoryLevelDto {
  id: string;
  businessUnitId: string;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;

  static from(entity: InventoryLevel): InventoryLevelDto {
    const dto = new InventoryLevelDto();
    dto.id = entity.id;
    dto.businessUnitId = entity.businessUnitId;
    dto.stockedQuantity = Number(entity.stockedQuantity);
    dto.reservedQuantity = Number(entity.reservedQuantity);
    dto.availableQuantity = Number(entity.stockedQuantity) - Number(entity.reservedQuantity);
    dto.reorderLevel = Number(entity.reorderLevel);
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
  requiresShipping: boolean;
  createdAt: string;
  updatedAt: string;

  static from(entity: InventoryItem, uomSymbol?: string | null): InventoryItemDto {
    const dto = new InventoryItemDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.code = entity.code;
    dto.type = entity.type;
    dto.description = entity.description ?? null;
    dto.uomId = entity.uomId;
    dto.uomSymbol = uomSymbol ?? null;
    dto.requiresShipping = entity.requiresShipping;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class InventoryItemDetailDto extends InventoryItemDto {
  levels: InventoryLevelDto[];
  ledger: InventoryLedgerDto[];

  static fromDetail(
    entity: InventoryItem,
    uomSymbol: string | null,
    levels: InventoryLevel[],
    ledger: InventoryLedgerEntry[],
  ): InventoryItemDetailDto {
    const dto = new InventoryItemDetailDto();
    Object.assign(dto, InventoryItemDto.from(entity, uomSymbol));
    dto.levels = levels.map(InventoryLevelDto.from);
    dto.ledger = ledger.map(InventoryLedgerDto.from);
    return dto;
  }
}
