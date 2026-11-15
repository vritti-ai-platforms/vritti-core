import type { Location, LocationRole } from '@/db/schema';
import type { LocationFillDto } from './location-fill.dto';

export type LocationRow = Location & {
  storageTypeName: string | null;
  inheritedFromLocationName: string | null;
};

export class LocationDto {
  id: string;
  organizationId: string;
  siteId: string;
  name: string;
  code: string;
  parentId: string | null;
  parentName: string | null;
  path: string;
  sortOrder: number;
  area: string | null;
  managerId: string | null;
  locationRole: LocationRole;
  storageTypeId: string | null;
  storageTypeName: string | null;
  isStorageTypeOverridden: boolean;
  inheritedFromLocationName: string | null;
  fill: LocationFillDto | null;
  isActive: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a location row with its storage type name and inheritance source to a DTO; fill is attached by the caller
  static from(entity: LocationRow, canDelete = true): LocationDto {
    const dto = new LocationDto();
    dto.id = entity.id;
    dto.organizationId = entity.organizationId;
    dto.siteId = entity.siteId;
    dto.name = entity.name;
    dto.code = entity.code;
    dto.parentId = entity.parentId ?? null;
    // Parent name from the human-readable breadcrumb ("A › B › Self") — the second-to-last segment.
    const breadcrumb = (entity.pathBreadcrumb ?? '')
      .split('›')
      .map((s) => s.trim())
      .filter(Boolean);
    dto.parentName = entity.parentId && breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2] : null;
    dto.path = entity.path;
    dto.sortOrder = entity.sortOrder;
    dto.area = entity.area ?? null;
    dto.managerId = entity.managerId ?? null;
    dto.locationRole = entity.locationRole;
    dto.storageTypeId = entity.storageTypeId ?? null;
    dto.storageTypeName = entity.storageTypeName ?? null;
    dto.isStorageTypeOverridden = entity.isStorageTypeOverridden;
    dto.inheritedFromLocationName = entity.inheritedFromLocationName ?? null;
    dto.fill = null;
    dto.isActive = entity.isActive;
    dto.canDelete = canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
