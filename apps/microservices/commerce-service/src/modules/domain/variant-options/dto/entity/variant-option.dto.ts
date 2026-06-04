import type { VariantOption, VariantOptionValue } from '@/db/schema';

export class VariantOptionValueDto {
  id: string;
  value: string;
  sortOrder: number;
  referenced: boolean;

  // Maps a VariantOptionValue entity to a DTO
  static from(entity: VariantOptionValue, referenced = false): VariantOptionValueDto {
    const dto = new VariantOptionValueDto();
    dto.id = entity.id;
    dto.value = entity.value;
    dto.sortOrder = entity.sortOrder;
    dto.referenced = referenced;
    return dto;
  }
}

export class VariantOptionDto {
  id: string;
  catalogId: string;
  name: string;
  sortOrder: number;
  values: VariantOptionValueDto[];
  createdAt: string;
  updatedAt: string;

  // Maps a VariantOption entity with its values to a DTO
  static from(entity: VariantOption, values: VariantOptionValue[], referencedIds?: Set<string>): VariantOptionDto {
    const dto = new VariantOptionDto();
    dto.id = entity.id;
    dto.catalogId = entity.catalogId;
    dto.name = entity.name;
    dto.sortOrder = entity.sortOrder;
    dto.values = values.map((value) => VariantOptionValueDto.from(value, referencedIds?.has(value.id) ?? false));
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
