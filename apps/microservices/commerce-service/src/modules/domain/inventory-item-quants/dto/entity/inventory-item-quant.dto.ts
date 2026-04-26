import type { InventoryItemQuant } from '@/db/schema';

export class InventoryItemQuantDto {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string | null;
  lotId: string | null;
  lotNumber: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  manufacturingDate: string | null;
  expiryDate: string | null;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(
    row: InventoryItemQuant & {
      locationName?: string | null;
      lotNumber?: string | null;
      manufacturingDate?: string | null;
      expiryDate?: string | null;
    },
    canDelete = false,
  ): InventoryItemQuantDto {
    const dto = new InventoryItemQuantDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.locationId = row.locationId;
    dto.locationName = row.locationName ?? null;
    dto.lotId = row.lotId ?? null;
    dto.lotNumber = row.lotNumber ?? null;
    dto.quantity = Number(row.quantity);
    dto.reservedQuantity = Number(row.reservedQuantity);
    dto.availableQuantity = Number(row.quantity) - Number(row.reservedQuantity);
    dto.manufacturingDate = row.manufacturingDate ?? null;
    dto.expiryDate = row.expiryDate ?? null;
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
