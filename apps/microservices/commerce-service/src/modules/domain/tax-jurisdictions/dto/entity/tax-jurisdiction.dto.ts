import type { TaxJurisdiction, TaxJurisdictionLevel } from '@/db/schema';

export class TaxJurisdictionDto {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  level: TaxJurisdictionLevel;
  parentId: string | null;
  parentName: string | null;
  countryCode: string;
  regionCode: string | null;
  taxUnion: string | null;
  isActive: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a TaxJurisdiction entity to a TaxJurisdictionDto
  static from(entity: TaxJurisdiction, canDelete = true, parentName: string | null = null): TaxJurisdictionDto {
    const dto = new TaxJurisdictionDto();
    dto.id = entity.id;
    dto.organizationId = entity.organizationId;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.level = entity.level;
    dto.parentId = entity.parentId ?? null;
    dto.parentName = parentName;
    dto.countryCode = entity.countryCode;
    dto.regionCode = entity.regionCode ?? null;
    dto.taxUnion = entity.taxUnion ?? null;
    dto.isActive = entity.isActive;
    dto.canDelete = canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
