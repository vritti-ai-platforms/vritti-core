// Per-inventory-item location config (mirrors the InventoryItemLocation GraphQL type). isBlocked = no new putaway
// of this item into this location.
export interface ItemLocation {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  isBlocked: boolean;
}
