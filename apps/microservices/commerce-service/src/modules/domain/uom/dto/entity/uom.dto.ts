import type { Uom } from '@/db/schema';

export class UomDto {
  id: string;
  name: string;
  symbol: string;
  baseUnitId: string | null;
  baseUnitSymbol: string | null;
  conversionFactor: number;
  createdAt: string;

  static from(entity: Uom, baseUnitSymbol?: string | null): UomDto {
    const dto = new UomDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.symbol = entity.symbol;
    dto.baseUnitId = entity.baseUnitId ?? null;
    dto.baseUnitSymbol = baseUnitSymbol ?? null;
    dto.conversionFactor = Number(entity.conversionFactor);
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
