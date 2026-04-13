import type { InventoryItemBatch } from '@/db/schema';

export class InventoryItemBatchDto {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string | null;
  batchNumber: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  manufacturingDate: string | null;
  expiryDate: string | null;
  goodsReceiptItemId: string | null;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(row: InventoryItemBatch & { locationName?: string | null }, canDelete = false): InventoryItemBatchDto {
    const dto = new InventoryItemBatchDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.locationId = row.locationId;
    dto.locationName = row.locationName ?? null;
    dto.batchNumber = row.batchNumber ?? null;
    dto.quantity = Number(row.quantity);
    dto.reservedQuantity = Number(row.reservedQuantity);
    dto.availableQuantity = Number(row.quantity) - Number(row.reservedQuantity);
    dto.manufacturingDate = row.manufacturingDate ?? null;
    dto.expiryDate = row.expiryDate ?? null;
    dto.goodsReceiptItemId = row.goodsReceiptItemId ?? null;
    dto.canDelete = canDelete;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}

export class LocationStockDto {
  locationId: string;
  locationName: string | null;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number | null;
}
