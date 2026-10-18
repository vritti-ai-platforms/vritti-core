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
