import type { SalesChannel, SalesChannelKind } from '@/db/schema';

export class SalesChannelDto {
  id: string;
  code: string;
  name: string;
  kind: SalesChannelKind;
  isActive: boolean;
  isSystem: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(entity: SalesChannel, canDelete = true): SalesChannelDto {
    const dto = new SalesChannelDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.kind = entity.kind;
    dto.isActive = entity.isActive;
    dto.isSystem = entity.isSystem;
    dto.canDelete = canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
