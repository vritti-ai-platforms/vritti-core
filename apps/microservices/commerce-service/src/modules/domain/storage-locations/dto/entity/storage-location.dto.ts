import type { StorageLocation } from '@/db/schema';

export class StorageLocationDto {
  id: string;
  organizationId: string;
  businessUnitId: string;
  name: string;
  code: string;
  parentId: string | null;
  sortOrder: number;
  area: string | null;
  managerId: string | null;
  address: string | null;
  isActive: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a StorageLocation entity to a DTO
  static from(entity: StorageLocation, canDelete = true): StorageLocationDto {
    const dto = new StorageLocationDto();
    dto.id = entity.id;
    dto.organizationId = entity.organizationId;
    dto.businessUnitId = entity.businessUnitId;
    dto.name = entity.name;
    dto.code = entity.code;
    dto.parentId = entity.parentId ?? null;
    dto.sortOrder = entity.sortOrder;
    dto.area = entity.area ?? null;
    dto.managerId = entity.managerId ?? null;
    dto.address = entity.address ?? null;
    dto.isActive = entity.isActive;
    dto.canDelete = canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
