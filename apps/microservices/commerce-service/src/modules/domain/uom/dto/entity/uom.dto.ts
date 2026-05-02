import type { Uom } from '@/db/schema';

export class UomDto {
  id: string;
  dimensionId: string;
  name: string;
  symbol: string;
  baseUnitId: string | null;
  conversionFactor: number;
  canDelete: boolean;
  createdAt: string;

  static from(entity: Uom, canDelete = true): UomDto {
    const dto = new UomDto();
    dto.id = entity.id;
    dto.dimensionId = entity.dimensionId;
    dto.name = entity.name;
    dto.symbol = entity.symbol;
    dto.baseUnitId = entity.baseUnitId ?? null;
    dto.conversionFactor = entity.conversionFactor;
    dto.canDelete = canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
