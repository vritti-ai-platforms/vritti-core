// Per-inventory-item UOM conversion override (mirrors the InventoryItemUomConversion GraphQL type).
export interface UomConversion {
  id: string;
  inventoryItemId: string;
  uomId: string;
  uomName: string;
  uomSymbol: string;
  // Count of the item's PRIMARY UOM in the ratio (1 Strip = 14 Each → primaryUomQty=14).
  primaryUomQty: number;
  // Count of THIS (alternative) UOM in the ratio (1 Strip = 14 Each → uomQty=1).
  uomQty: number;
  toPrimaryConversionFactor: number;
  toUomConversionFactor: number;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}
