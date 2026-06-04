import type { UomDimension } from '@/db/schema';

export class UomDimensionDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  canEdit: boolean;
  canDelete?: boolean;
  createdAt: string;
  updatedAt: string;

  static from(row: UomDimension, currentBuId: string, hasNoRefs?: boolean): UomDimensionDto {
    const dto = new UomDimensionDto();
    dto.id = row.id;
    dto.code = row.code;
    dto.name = row.name;
    dto.description = row.description;
    dto.canEdit = row.businessUnitId === currentBuId;
    if (hasNoRefs !== undefined) dto.canDelete = row.businessUnitId === currentBuId && hasNoRefs;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
