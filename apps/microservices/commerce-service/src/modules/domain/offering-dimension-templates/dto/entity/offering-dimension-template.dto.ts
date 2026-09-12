import type { OfferingDimensionTemplate, OfferingDimensionTemplateValue } from '@/db/schema';

export type TemplateOwnerScope = 'ORG' | 'LE' | 'SITE';

export class OfferingDimensionTemplateValueDto {
  id: string;
  templateId: string;
  code: string;
  value: string;
  sortOrder: number;

  static from(entity: OfferingDimensionTemplateValue): OfferingDimensionTemplateValueDto {
    const dto = new OfferingDimensionTemplateValueDto();
    dto.id = entity.id;
    dto.templateId = entity.templateId;
    dto.code = entity.code;
    dto.value = entity.value;
    dto.sortOrder = entity.sortOrder;
    return dto;
  }
}

export class OfferingDimensionTemplateDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: TemplateOwnerScope;
  values: OfferingDimensionTemplateValueDto[];
  valueCount: number;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(
    entity: OfferingDimensionTemplate,
    options: {
      values?: OfferingDimensionTemplateValue[];
      valueCount?: number;
      isOwned?: boolean;
      canDelete?: boolean;
    } = {},
  ): OfferingDimensionTemplateDto {
    const { values, valueCount, isOwned = false, canDelete = false } = options;
    const dto = new OfferingDimensionTemplateDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.sortOrder = entity.sortOrder;
    dto.isActive = entity.isActive;
    dto.legalEntityId = entity.legalEntityId ?? null;
    dto.siteId = entity.siteId ?? null;
    dto.ownerScope = entity.siteId ? 'SITE' : entity.legalEntityId ? 'LE' : 'ORG';
    dto.values = (values ?? []).map(OfferingDimensionTemplateValueDto.from);
    dto.valueCount = valueCount ?? values?.length ?? 0;
    dto.canEdit = isOwned;
    dto.canDelete = isOwned && canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
