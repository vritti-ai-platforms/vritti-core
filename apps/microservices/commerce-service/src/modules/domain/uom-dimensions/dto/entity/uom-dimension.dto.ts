import type { UomDimension } from '@/db/schema';

export class UomDimensionDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  canDelete?: boolean;
  createdAt: string;
  updatedAt: string;

  static from(row: UomDimension, canDelete?: boolean): UomDimensionDto {
    const dto = new UomDimensionDto();
    dto.id = row.id;
    dto.code = row.code;
    dto.name = row.name;
    dto.description = row.description;
    if (canDelete !== undefined) dto.canDelete = canDelete;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
