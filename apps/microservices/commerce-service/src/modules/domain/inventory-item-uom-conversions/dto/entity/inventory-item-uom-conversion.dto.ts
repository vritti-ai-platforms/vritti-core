import type { InventoryItemUomConversion } from '@/db/schema';

type ConversionRow = InventoryItemUomConversion & {
  uomName: string | null;
  uomSymbol: string | null;
  uomConversionFactor: number | null;
  uomBaseUnitId: string | null;
  baseUomSymbol: string | null;
};

export class InventoryItemUomConversionDto {
  id: string;
  inventoryItemId: string;
  uomId: string;
  uomName: string;
  uomSymbol: string;
  baseUomId: string | null;
  baseUomSymbol: string | null;
  defaultConversionFactor: number;
  conversionFactor: number;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(row: ConversionRow, currentBuId: string): InventoryItemUomConversionDto {
    const dto = new InventoryItemUomConversionDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.uomId = row.uomId;
    dto.uomName = row.uomName ?? '';
    dto.uomSymbol = row.uomSymbol ?? '';
    dto.baseUomId = row.uomBaseUnitId ?? null;
    dto.baseUomSymbol = row.baseUomSymbol ?? null;
    dto.defaultConversionFactor = row.uomConversionFactor ?? 1;
    dto.conversionFactor = row.conversionFactor;
    dto.canEdit = row.businessUnitId === currentBuId;
    dto.canDelete = row.businessUnitId === currentBuId;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
