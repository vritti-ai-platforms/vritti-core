// Tree node for OPENING+serial UI: lots as roots, lines as their children.
// Mirrors the locations tree pattern (path-encoded depth).
export interface StockAdjustmentTreeNode {
  id: string;
  name: string;
  path: string[];
  kind: 'lot' | 'line';
  totalQuantity?: number;
  linesCount?: number;
  uomQty?: number;
  lineItemsCount?: number;
  isBalanced: boolean;
  children?: StockAdjustmentTreeNode[];
}
