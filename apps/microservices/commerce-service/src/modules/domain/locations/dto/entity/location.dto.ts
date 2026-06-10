import type { Location, LocationRole } from '@/db/schema';

export class LocationDto {
  id: string;
  organizationId: string;
  businessUnitId: string;
  name: string;
  code: string;
  parentId: string | null;
  parentName: string | null;
  path: string;
  sortOrder: number;
  area: string | null;
  managerId: string | null;
  locationRole: LocationRole;
  isActive: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a Location entity to a DTO
  static from(entity: Location, canDelete = true): LocationDto {
    const dto = new LocationDto();
    dto.id = entity.id;
    dto.organizationId = entity.organizationId;
    dto.businessUnitId = entity.businessUnitId;
    dto.name = entity.name;
    dto.code = entity.code;
    dto.parentId = entity.parentId ?? null;
    // Parent name from the human-readable breadcrumb ("A › B › Self") — the second-to-last segment.
    const breadcrumb = (entity.pathBreadcrumb ?? '').split('›').map((s) => s.trim()).filter(Boolean);
    dto.parentName = entity.parentId && breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2] : null;
    dto.path = entity.path;
    dto.sortOrder = entity.sortOrder;
    dto.area = entity.area ?? null;
    dto.managerId = entity.managerId ?? null;
    dto.locationRole = entity.locationRole;
    dto.isActive = entity.isActive;
    dto.canDelete = canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
