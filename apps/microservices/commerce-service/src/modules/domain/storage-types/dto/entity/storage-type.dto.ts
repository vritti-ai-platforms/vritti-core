import type { StorageCapacityCheck, StorageType } from '@/db/schema';

export class StorageTypeDto {
  id: string;
  code: string;
  name: string;
  maxWeight: number | null;
  maxVolume: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  capacityCheck: StorageCapacityCheck;
  allowMixedItems: boolean;
  allowMixedBatches: boolean;
  allowAdditionToStock: boolean;
  isActive: boolean;
  locationCount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;

  // Maps a storage type row and its usage counts to a DTO
  static from(entity: StorageType & { locationCount: number; itemCount: number }): StorageTypeDto {
    const dto = new StorageTypeDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.maxWeight = entity.maxWeight ?? null;
    dto.maxVolume = entity.maxVolume ?? null;
    dto.length = entity.length ?? null;
    dto.width = entity.width ?? null;
    dto.height = entity.height ?? null;
    dto.capacityCheck = entity.capacityCheck;
    dto.allowMixedItems = entity.allowMixedItems;
    dto.allowMixedBatches = entity.allowMixedBatches;
    dto.allowAdditionToStock = entity.allowAdditionToStock;
    dto.isActive = entity.isActive;
    dto.locationCount = Number(entity.locationCount);
    dto.itemCount = Number(entity.itemCount);
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
