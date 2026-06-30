// Shared list/feed contract mirrored from the backend cursor-feed endpoints. These shapes
// are the wire contract — keep them in sync with the server's FilterCondition / SearchState /
// SortCondition definitions.

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'isAnyOf'
  | 'isNotAnyOf';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string | number | string[];
}

export interface SearchState {
  columnId: string;
  value: string;
}

export interface SortCondition {
  field: string;
  direction: 'asc' | 'desc';
}

// Generic cursor-page contract lives in the package (one definition, reusable across micro-apps).
export type { CursorPage } from '@vritti/quantum-ui-native/types';

export type InventoryItemType = 'RAW_MATERIAL' | 'SEMI_FINISHED' | 'FINISHED_GOOD' | 'PACKAGING' | 'CONSUMABLE';

export type InventoryItemTracking = 'quantity' | 'lot' | 'lot_serial' | 'serial';

export type InventoryItemPickStrategy = 'none' | 'fifo' | 'fefo';

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  type: InventoryItemType;
  tracking: InventoryItemTracking;
  pickStrategy: InventoryItemPickStrategy;
  categoryId: string;
  categoryName: string | null;
  description: string | null;
  uomId: string;
  uomSymbol: string | null;
  purchaseTaxGroupId: string | null;
  hsnCode: string | null;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}
