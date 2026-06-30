import type { InventoryItem } from "../../types/inventory-items";

export type InventoryRoute =
  | "InventoryList"
  | "InventoryItemDetail"
  | "InventoryItemCreate"
  | "InventoryItemEdit";

// Detail + Edit take the item id (not the whole row), so they read it live from the cache and reflect
// edits immediately. PushNavigator.push is param-less, so we use React Navigation's navigate directly.
export interface InventoryItemDetailParams {
  id: string;
}

export interface InventoryItemEditParams {
  id: string;
}

export type InventoryNavigation = {
  navigate: {
    (screen: "InventoryItemDetail", params: InventoryItemDetailParams): void;
    (screen: "InventoryItemEdit", params: InventoryItemEditParams): void;
    (screen: "InventoryItemCreate"): void;
  };
  goBack: () => void;
};

// Single-item query result shape (shared by the detail header + edit screen).
export interface InventoryItemQueryData {
  inventoryItem: InventoryItem | null;
}
