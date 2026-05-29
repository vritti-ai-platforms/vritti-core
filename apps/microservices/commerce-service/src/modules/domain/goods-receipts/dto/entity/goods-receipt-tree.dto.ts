// Tree node for the unified GR UI: items → lots → lines, depth varies per item.tracking.
// Stays intentionally minimal — carries only what the tree row renders (label + balance badge).
// Item / lot / line *detail* panels fetch via their own endpoints when a node is selected.
export interface GoodsReceiptTreeNode {
  id: string;
  name: string;
  kind: 'item' | 'lot' | 'line';
  balanced: boolean;
  badge: string;
  children?: GoodsReceiptTreeNode[];
}
