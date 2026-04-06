import type { ModifierGroup, ModifierOption, ModifierSelectionType } from '@/db/schema';
import { ModifierOptionDto } from './modifier-option.dto';

export class ModifierGroupDto {
  id: string;
  businessUnitId: string;
  name: string;
  selectionType: ModifierSelectionType;
  minSelections: number;
  maxSelections: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;

  // Maps a ModifierGroup entity to a ModifierGroupDto
  static from(entity: ModifierGroup): ModifierGroupDto {
    const dto = new ModifierGroupDto();
    dto.id = entity.id;
    dto.businessUnitId = entity.businessUnitId;
    dto.name = entity.name;
    dto.selectionType = entity.selectionType;
    dto.minSelections = entity.minSelections;
    dto.maxSelections = entity.maxSelections ?? null;
    dto.sortOrder = entity.sortOrder;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}

export class ModifierGroupWithOptionsDto {
  id: string;
  businessUnitId: string;
  name: string;
  selectionType: ModifierSelectionType;
  minSelections: number;
  maxSelections: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  options: ModifierOptionDto[];

  // Maps a ModifierGroup entity with its options to a DTO
  static from(entity: ModifierGroup, options: ModifierOption[]): ModifierGroupWithOptionsDto {
    const dto = new ModifierGroupWithOptionsDto();
    dto.id = entity.id;
    dto.businessUnitId = entity.businessUnitId;
    dto.name = entity.name;
    dto.selectionType = entity.selectionType;
    dto.minSelections = entity.minSelections;
    dto.maxSelections = entity.maxSelections ?? null;
    dto.sortOrder = entity.sortOrder;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.options = options.map(ModifierOptionDto.from);
    return dto;
  }
}
