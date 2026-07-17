import type { TaxAuthorityLevel, TaxComponent } from '@/db/schema';

export class TaxComponentDto {
  id: string;
  code: string;
  name: string;
  authorityLevel: TaxAuthorityLevel;
  isRecoverable: boolean;
  isWithholding: boolean;
  isActive: boolean;
  isSystem: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(entity: TaxComponent, canDelete = true): TaxComponentDto {
    const dto = new TaxComponentDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.authorityLevel = entity.authorityLevel;
    dto.isRecoverable = entity.isRecoverable;
    dto.isWithholding = entity.isWithholding;
    dto.isActive = entity.isActive;
    dto.isSystem = entity.isSystem;
    dto.canDelete = canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
