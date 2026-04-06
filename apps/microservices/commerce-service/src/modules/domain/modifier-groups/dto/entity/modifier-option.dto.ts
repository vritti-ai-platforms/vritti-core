import type { ModifierOption } from '@/db/schema';

export class ModifierOptionDto {
  id: string;
  groupId: string;
  name: string;
  additionalPrice: string;
  isDefault: boolean;
  isAvailable: boolean;
  sortOrder: number;

  // Maps a ModifierOption entity to a ModifierOptionDto
  static from(entity: ModifierOption): ModifierOptionDto {
    const dto = new ModifierOptionDto();
    dto.id = entity.id;
    dto.groupId = entity.groupId;
    dto.name = entity.name;
    dto.additionalPrice = entity.additionalPrice;
    dto.isDefault = entity.isDefault;
    dto.isAvailable = entity.isAvailable;
    dto.sortOrder = entity.sortOrder;
    return dto;
  }
}
