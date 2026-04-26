// Tree node for OPENING+serial UI: lots as roots, lines as their children.
// Mirrors the storage-locations tree pattern (path-encoded depth).
export interface StockAdjustmentTreeNode {
  id: string;
  name: string;
  path: string[];
  kind: 'lot' | 'line';
  totalQuantity?: number;
  linesCount?: number;
  quantity?: number;
  lineItemsCount?: number;
  isBalanced: boolean;
  children?: StockAdjustmentTreeNode[];
}
