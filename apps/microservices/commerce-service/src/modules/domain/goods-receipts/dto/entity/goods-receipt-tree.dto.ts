import type { InventoryTracking } from '@/db/schema';

// Tree node for the unified GR UI: items → lots → lines, depth varies per item.tracking.
// Mirrors the locations / SA tree pattern (path-encoded depth).
export interface GoodsReceiptTreeNode {
  id: string;
  name: string;
  path: string[];
  kind: 'item' | 'lot' | 'line';
  // item-only:
  inventoryItemId?: string;
  inventoryItemTracking?: InventoryTracking;
  inventoryItemUomSymbol?: string;
  inventoryItemAllowDecimal?: boolean;
  acceptedQuantity?: number;
  rejectedQuantity?: number;
  poOrderedQuantity?: number | null;
  poReceivedQuantity?: number | null;
  poRemainingQuantity?: number | null;
  // lot-only:
  totalQuantity?: number;
  linesCount?: number;
  // line-only:
  quantity?: number;
  lineItemsCount?: number;
  isBalanced: boolean;
  children?: GoodsReceiptTreeNode[];
}
