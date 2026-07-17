import type { TaxClass } from '@/db/schema';

export class TaxClassDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isSystem: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(entity: TaxClass, canDelete = true): TaxClassDto {
    const dto = new TaxClassDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.isActive = entity.isActive;
    dto.isSystem = entity.isSystem;
    dto.canDelete = canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
