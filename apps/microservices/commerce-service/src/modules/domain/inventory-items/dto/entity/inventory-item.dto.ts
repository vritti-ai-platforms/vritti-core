import type { InventoryItem, InventoryItemType, InventoryPickStrategy, InventoryTracking } from '@/db/schema';
import type { InventoryItemNames } from '../../repositories/inventory-items.repository';

export class InventoryItemDto {
  id: string;
  name: string;
  sku: string;
  type: InventoryItemType;
  tracking: InventoryTracking;
  pickStrategy: InventoryPickStrategy;
  categoryId: string;
  categoryName: string;
  description: string | null;
  uomId: string;
  uomSymbol: string;
  // Whether the item's primary unit can be counted in fractions
  uomAllowDecimal: boolean;
  displayUomId: string;
  displayUomSymbol: string;
  hsnCode: string | null;
  taxClassId: string;
  taxClassName: string;
  weight: number | null;
  volume: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(row: InventoryItem & InventoryItemNames, canDelete = true): InventoryItemDto {
    const dto = new InventoryItemDto();
    dto.id = row.id;
    dto.name = row.name;
    dto.sku = row.sku;
    dto.type = row.type;
    dto.tracking = row.tracking;
    dto.pickStrategy = row.pickStrategy;
    dto.categoryId = row.categoryId;
    dto.categoryName = row.categoryName;
    dto.description = row.description ?? null;
    dto.uomId = row.uomId;
    dto.uomSymbol = row.uomSymbol;
    dto.uomAllowDecimal = row.uomAllowDecimal;
    dto.displayUomId = row.displayUomId;
    dto.displayUomSymbol = row.displayUomSymbol;
    dto.hsnCode = row.hsnCode ?? null;
    dto.taxClassId = row.taxClassId;
    dto.taxClassName = row.taxClassName;
    dto.weight = row.weight ?? null;
    dto.volume = row.volume ?? null;
    dto.length = row.length ?? null;
    dto.width = row.width ?? null;
    dto.height = row.height ?? null;
    dto.canDelete = canDelete;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
