// Per-inventory-item location config (mirrors the InventoryItemLocation GraphQL type). reorderLevel = the
// "Min. Stock Level" threshold for this item at this location.
export interface ItemLocation {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  reorderLevel: number;
}
