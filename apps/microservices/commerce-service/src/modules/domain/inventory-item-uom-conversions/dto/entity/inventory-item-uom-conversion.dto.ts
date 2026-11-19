import type { InventoryItemUomConversion } from '@/db/schema';

type ConversionRow = InventoryItemUomConversion & {
  uomName: string;
  uomSymbol: string;
};

export class InventoryItemUomConversionDto {
  id: string;
  inventoryItemId: string;
  uomId: string;
  uomName: string;
  uomSymbol: string;
  primaryUomQty: number;
  uomQty: number;
  // Derived: 1 UOM unit = `toPrimaryConversionFactor` primary units.
  toPrimaryConversionFactor: number;
  // Derived: 1 primary unit = `toUomConversionFactor` UOM units.
  toUomConversionFactor: number;
  weight: number | null;
  volume: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  isDisplayUnit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(row: ConversionRow, isUsedBySupplierItem = false, isDisplayUnit = false): InventoryItemUomConversionDto {
    const dto = new InventoryItemUomConversionDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.uomId = row.uomId;
    dto.uomName = row.uomName;
    dto.uomSymbol = row.uomSymbol;
    dto.primaryUomQty = row.primaryUomQty;
    dto.uomQty = row.uomQty;
    dto.toPrimaryConversionFactor = row.primaryUomQty / row.uomQty;
    dto.toUomConversionFactor = row.uomQty / row.primaryUomQty;
    dto.weight = row.weight ?? null;
    dto.volume = row.volume ?? null;
    dto.length = row.length ?? null;
    dto.width = row.width ?? null;
    dto.height = row.height ?? null;
    dto.isDisplayUnit = isDisplayUnit;
    dto.canDelete = !isUsedBySupplierItem && !isDisplayUnit;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
