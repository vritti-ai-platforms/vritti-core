import type { OfferingDimension, OfferingDimensionValue } from '@/db/schema';

export class OfferingDimensionValueDto {
  id: string;
  dimensionId: string;
  code: string;
  value: string;
  sortOrder: number;
  canDelete: boolean;

  static from(entity: OfferingDimensionValue & { canDelete: boolean }): OfferingDimensionValueDto {
    const dto = new OfferingDimensionValueDto();
    dto.id = entity.id;
    dto.dimensionId = entity.dimensionId;
    dto.code = entity.code;
    dto.value = entity.value;
    dto.sortOrder = entity.sortOrder;
    dto.canDelete = entity.canDelete;
    return dto;
  }
}

export class OfferingDimensionDto {
  id: string;
  offeringId: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  values: OfferingDimensionValueDto[];
  valueCount: number;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(
    entity: OfferingDimension & { canDelete: boolean },
    values: (OfferingDimensionValue & { canDelete: boolean })[] = [],
  ): OfferingDimensionDto {
    const dto = new OfferingDimensionDto();
    dto.id = entity.id;
    dto.offeringId = entity.offeringId;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.sortOrder = entity.sortOrder;
    dto.values = values.map(OfferingDimensionValueDto.from);
    dto.valueCount = values.length;
    dto.canDelete = entity.canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
