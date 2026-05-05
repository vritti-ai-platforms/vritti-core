import type { InventoryItemLocation } from '@/db/schema';

export class InventoryItemLocationDto {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string | null;
  reorderLevel: number;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  createdAt: string;
  updatedAt: string;

  // Maps an InventoryItemLocation entity to a DTO
  static from(
    row: InventoryItemLocation & {
      locationName?: string | null;
      stockedQuantity?: string | null;
      reservedQuantity?: string | null;
    },
  ): InventoryItemLocationDto {
    const dto = new InventoryItemLocationDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.locationId = row.locationId;
    dto.locationName = row.locationName ?? null;
    dto.reorderLevel = Number(row.reorderLevel);
    dto.stockedQuantity = Number(row.stockedQuantity ?? 0);
    dto.reservedQuantity = Number(row.reservedQuantity ?? 0);
    dto.availableQuantity = dto.stockedQuantity - dto.reservedQuantity;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
