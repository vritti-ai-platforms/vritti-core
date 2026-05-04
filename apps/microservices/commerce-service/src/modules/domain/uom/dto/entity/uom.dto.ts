import type { Uom } from '@/db/schema';

export class UomDto {
  id: string;
  dimensionId: string;
  name: string;
  symbol: string;
  baseUnitId: string | null;
  conversionFactor: number;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;

  static from(entity: Uom, currentBuId: string, canDelete = true): UomDto {
    const dto = new UomDto();
    dto.id = entity.id;
    dto.dimensionId = entity.dimensionId;
    dto.name = entity.name;
    dto.symbol = entity.symbol;
    dto.baseUnitId = entity.baseUnitId ?? null;
    dto.conversionFactor = entity.conversionFactor;
    dto.canEdit = entity.businessUnitId === currentBuId;
    dto.canDelete = entity.businessUnitId === currentBuId && canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
