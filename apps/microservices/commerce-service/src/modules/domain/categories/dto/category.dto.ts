import type { Category } from '@/db/schema';

export class CategoryDto {
  id: string;
  organizationId: string;
  businessUnitId: string;
  name: string;
  image: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;

  // Maps a Category entity to a CategoryDto
  static from(entity: Category): CategoryDto {
    const dto = new CategoryDto();
    dto.id = entity.id;
    dto.organizationId = entity.organizationId;
    dto.businessUnitId = entity.businessUnitId;
    dto.name = entity.name;
    dto.image = entity.image ?? null;
    dto.parentId = entity.parentId ?? null;
    dto.isActive = entity.isActive;
    dto.sortOrder = entity.sortOrder;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
