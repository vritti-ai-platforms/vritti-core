import type { InventoryItemStorageType } from '@/db/schema';

export type InventoryItemStorageTypeRow = InventoryItemStorageType & {
  storageTypeName: string;
  uomSymbol: string;
};

export class InventoryItemStorageTypeDto {
  id: string;
  inventoryItemId: string;
  storageTypeId: string;
  storageTypeName: string;
  maxQuantity: number;
  uomId: string;
  uomSymbol: string;
  createdAt: string;
  updatedAt: string;

  // Maps an item × storage type row with its storage type name and unit symbol to a DTO
  static from(row: InventoryItemStorageTypeRow): InventoryItemStorageTypeDto {
    const dto = new InventoryItemStorageTypeDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.storageTypeId = row.storageTypeId;
    dto.storageTypeName = row.storageTypeName;
    dto.maxQuantity = row.maxQuantity;
    dto.uomId = row.uomId;
    dto.uomSymbol = row.uomSymbol;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
