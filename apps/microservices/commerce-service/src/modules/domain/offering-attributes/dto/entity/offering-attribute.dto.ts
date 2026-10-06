import type { OfferingAttribute, OfferingAttributeValue } from '@/db/schema';

export type AttributeValueSource = Pick<
  OfferingAttributeValue,
  'id' | 'attributeId' | 'code' | 'value' | 'sortOrder'
> & { canDelete: boolean };

export class OfferingAttributeValueDto {
  id: string;
  attributeId: string;
  code: string;
  value: string;
  sortOrder: number;
  canDelete: boolean;

  static from(entity: AttributeValueSource): OfferingAttributeValueDto {
    const dto = new OfferingAttributeValueDto();
    dto.id = entity.id;
    dto.attributeId = entity.attributeId;
    dto.code = entity.code;
    dto.value = entity.value;
    dto.sortOrder = entity.sortOrder;
    dto.canDelete = entity.canDelete;
    return dto;
  }
}

export class OfferingAttributeDto {
  id: string;
  offeringId: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  values: OfferingAttributeValueDto[];
  valueCount: number;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(
    entity: OfferingAttribute & { canDelete: boolean },
    values: AttributeValueSource[] = [],
  ): OfferingAttributeDto {
    const dto = new OfferingAttributeDto();
    dto.id = entity.id;
    dto.offeringId = entity.offeringId;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.sortOrder = entity.sortOrder;
    dto.values = values.map(OfferingAttributeValueDto.from);
    dto.valueCount = values.length;
    dto.canDelete = entity.canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
