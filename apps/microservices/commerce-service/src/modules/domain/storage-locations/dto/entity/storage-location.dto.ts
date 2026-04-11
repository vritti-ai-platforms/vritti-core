import type { StorageLocation } from '@/db/schema';

export class StorageLocationDto {
  id: string;
  name: string;
  code: string;
  area: string | null;
  managerId: string | null;
  address: string | null;
  isActive: boolean;
  canDelete: boolean;
  createdAt: string;

  // Maps a StorageLocation entity to a DTO
  static from(entity: StorageLocation, canDelete = true): StorageLocationDto {
    const dto = new StorageLocationDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.code = entity.code;
    dto.area = entity.area ?? null;
    dto.managerId = entity.managerId ?? null;
    dto.address = entity.address ?? null;
    dto.isActive = entity.isActive;
    dto.canDelete = canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}

export class LocationStockDto {
  id: string;
  inventoryItemId: string;
  itemName: string | null;
  itemCode: string | null;
  uomSymbol: string | null;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;

  // Maps a joined inventory level row to a stock DTO
  static from(row: {
    id: string;
    inventoryItemId: string;
    itemName: string | null;
    itemCode: string | null;
    uomSymbol: string | null;
    stockedQuantity: string;
    reservedQuantity: string;
    reorderLevel: string;
  }): LocationStockDto {
    const dto = new LocationStockDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.itemName = row.itemName;
    dto.itemCode = row.itemCode;
    dto.uomSymbol = row.uomSymbol;
    dto.stockedQuantity = Number(row.stockedQuantity);
    dto.reservedQuantity = Number(row.reservedQuantity);
    dto.availableQuantity = Number(row.stockedQuantity) - Number(row.reservedQuantity);
    dto.reorderLevel = Number(row.reorderLevel);
    return dto;
  }
}
