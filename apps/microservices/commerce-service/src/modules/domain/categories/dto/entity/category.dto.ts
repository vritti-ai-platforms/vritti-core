import type { Category, CategoryRole } from '@/db/schema';

export class CategoryDto {
  id: string;
  organizationId: string;
  name: string;
  image: string | null;
  parentId: string | null;
  categoryRole: CategoryRole;
  pathLabel: string;
  path: string;
  isActive: boolean;
  sortOrder: number;
  defaultTaxGroupId: string | null;
  createdAt: string;
  updatedAt: string;
  canDelete: boolean;

  // Maps a Category entity to a CategoryDto
  static from(entity: Category, canDelete = true): CategoryDto {
    const dto = new CategoryDto();
    dto.id = entity.id;
    dto.organizationId = entity.organizationId;
    dto.name = entity.name;
    dto.image = entity.image ?? null;
    dto.parentId = entity.parentId ?? null;
    dto.categoryRole = entity.categoryRole;
    dto.pathLabel = entity.pathLabel;
    dto.path = entity.path;
    dto.isActive = entity.isActive;
    dto.sortOrder = entity.sortOrder;
    dto.defaultTaxGroupId = entity.defaultTaxGroupId ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    dto.canDelete = canDelete;
    return dto;
  }
}
