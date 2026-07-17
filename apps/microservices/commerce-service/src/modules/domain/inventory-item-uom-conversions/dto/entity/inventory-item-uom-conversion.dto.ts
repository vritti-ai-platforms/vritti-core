import type { InventoryItemUomConversion } from '@/db/schema';

type ConversionRow = InventoryItemUomConversion & {
  uomName: string | null;
  uomSymbol: string | null;
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
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(row: ConversionRow, isUsedBySupplierItem = false): InventoryItemUomConversionDto {
    const dto = new InventoryItemUomConversionDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.uomId = row.uomId;
    dto.uomName = row.uomName ?? '';
    dto.uomSymbol = row.uomSymbol ?? '';
    dto.primaryUomQty = row.primaryUomQty;
    dto.uomQty = row.uomQty;
    dto.toPrimaryConversionFactor = row.primaryUomQty / row.uomQty;
    dto.toUomConversionFactor = row.uomQty / row.primaryUomQty;
    dto.canDelete = !isUsedBySupplierItem;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
