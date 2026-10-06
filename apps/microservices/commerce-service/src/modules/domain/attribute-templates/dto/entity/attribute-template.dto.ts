import type { AttributeTemplate, AttributeTemplateValue } from '@/db/schema';

export type TemplateOwnerScope = 'ORG' | 'LE' | 'SITE';

export class AttributeTemplateValueDto {
  id: string;
  templateId: string;
  code: string;
  value: string;
  sortOrder: number;

  // Maps an AttributeTemplateValue entity to an AttributeTemplateValueDto
  static from(entity: AttributeTemplateValue): AttributeTemplateValueDto {
    const dto = new AttributeTemplateValueDto();
    dto.id = entity.id;
    dto.templateId = entity.templateId;
    dto.code = entity.code;
    dto.value = entity.value;
    dto.sortOrder = entity.sortOrder;
    return dto;
  }
}

export class AttributeTemplateDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: TemplateOwnerScope;
  values: AttributeTemplateValueDto[];
  valueCount: number;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps an AttributeTemplate entity with its values to an AttributeTemplateDto; only the owning
  // workspace may change it, so isOwned drives both canEdit and canDelete
  static from(entity: AttributeTemplate, values: AttributeTemplateValue[] = [], isOwned = false): AttributeTemplateDto {
    const dto = new AttributeTemplateDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.isActive = entity.isActive;
    dto.legalEntityId = entity.legalEntityId ?? null;
    dto.siteId = entity.siteId ?? null;
    dto.ownerScope = entity.siteId ? 'SITE' : entity.legalEntityId ? 'LE' : 'ORG';
    dto.values = values.map(AttributeTemplateValueDto.from);
    dto.valueCount = values.length;
    dto.canEdit = isOwned;
    dto.canDelete = isOwned;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
