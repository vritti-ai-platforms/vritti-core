// Per-location stock aggregate for an inventory item (mirrors the InventoryItemStockLevel GraphQL type).
export interface StockLevel {
  id: string;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number | null;
}
