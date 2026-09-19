import type { DimensionTemplate, DimensionTemplateValue } from '@/db/schema';

export type TemplateOwnerScope = 'ORG' | 'LE' | 'SITE';

export class DimensionTemplateValueDto {
  id: string;
  templateId: string;
  code: string;
  value: string;
  sortOrder: number;

  // Maps a DimensionTemplateValue entity to a DimensionTemplateValueDto
  static from(entity: DimensionTemplateValue): DimensionTemplateValueDto {
    const dto = new DimensionTemplateValueDto();
    dto.id = entity.id;
    dto.templateId = entity.templateId;
    dto.code = entity.code;
    dto.value = entity.value;
    dto.sortOrder = entity.sortOrder;
    return dto;
  }
}

export class DimensionTemplateDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: TemplateOwnerScope;
  values: DimensionTemplateValueDto[];
  valueCount: number;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a DimensionTemplate entity with its values to a DimensionTemplateDto; only the owning
  // workspace may change it, so isOwned drives both canEdit and canDelete
  static from(entity: DimensionTemplate, values: DimensionTemplateValue[] = [], isOwned = false): DimensionTemplateDto {
    const dto = new DimensionTemplateDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.isActive = entity.isActive;
    dto.legalEntityId = entity.legalEntityId ?? null;
    dto.siteId = entity.siteId ?? null;
    dto.ownerScope = entity.siteId ? 'SITE' : entity.legalEntityId ? 'LE' : 'ORG';
    dto.values = values.map(DimensionTemplateValueDto.from);
    dto.valueCount = values.length;
    dto.canEdit = isOwned;
    dto.canDelete = isOwned;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
