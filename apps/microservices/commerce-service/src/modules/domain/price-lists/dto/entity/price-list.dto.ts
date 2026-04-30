import type { PriceList } from '@/db/schema';

export class PriceListDto {
  id: string;
  organizationId: string;
  businessUnitId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  assignedItemsCount: number;
  assignedTerminalsCount: number;
  createdAt: string;
  updatedAt: string;

  static from(
    entity: PriceList & {
      assignedItemsCount?: number;
      assignedTerminalsCount?: number;
    },
  ): PriceListDto {
    const dto = new PriceListDto();
    dto.id = entity.id;
    dto.organizationId = entity.organizationId;
    dto.businessUnitId = entity.businessUnitId;
    dto.name = entity.name;
    dto.code = entity.code;
    dto.description = entity.description ?? null;
    dto.isActive = entity.isActive;
    dto.assignedItemsCount = Number(entity.assignedItemsCount ?? 0);
    dto.assignedTerminalsCount = Number(entity.assignedTerminalsCount ?? 0);
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
