// A supplier link for an inventory item (mirrors the InventoryItemSupplier GraphQL type).
export interface SupplierUnitPrice {
  currency: string;
  value: string;
}

export interface Supplier {
  id: string;
  supplierId: string;
  supplierName: string | null;
  supplierCode: string | null;
  supplierItemCode: string | null;
  unitPrice: SupplierUnitPrice | null;
  uomId: string;
  uomSymbol: string;
  minOrderQuantity: number | null;
  leadTimeDays: number | null;
  isPreferred: boolean;
  isActive: boolean;
}
