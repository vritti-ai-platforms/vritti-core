import type { StorageLocationConfig } from '@/db/schema';

export class StorageLocationConfigDto {
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

  // Maps a StorageLocationConfig entity to a DTO
  static from(
    row: StorageLocationConfig & {
      locationName?: string | null;
      stockedQuantity?: string | null;
      reservedQuantity?: string | null;
    },
  ): StorageLocationConfigDto {
    const dto = new StorageLocationConfigDto();
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
