import type { InventoryItemLocation } from '@/db/schema';

export class InventoryItemLocationDto {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  reorderLevel: number;
  createdAt: string;
  updatedAt: string;

  // Maps an InventoryItemLocation entity to a DTO
  static from(
    row: InventoryItemLocation & {
      locationName?: string | null;
      locationPath?: string | null;
    },
  ): InventoryItemLocationDto {
    const dto = new InventoryItemLocationDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.locationId = row.locationId;
    dto.locationName = row.locationName ?? null;
    dto.locationPath = row.locationPath ?? null;
    dto.reorderLevel = Number(row.reorderLevel);
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
