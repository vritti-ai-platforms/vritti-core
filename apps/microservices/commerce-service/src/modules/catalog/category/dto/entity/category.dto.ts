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

  // Creates a DTO from a Category entity
  static from(category: Category): CategoryDto {
    const dto = new CategoryDto();
    dto.id = category.id;
    dto.organizationId = category.organizationId;
    dto.businessUnitId = category.businessUnitId;
    dto.name = category.name;
    dto.image = category.image ?? null;
    dto.parentId = category.parentId ?? null;
    dto.isActive = category.isActive;
    dto.sortOrder = category.sortOrder;
    dto.createdAt = category.createdAt.toISOString();
    dto.updatedAt = category.updatedAt.toISOString();
    return dto;
  }
}
