export const GOODS_RECEIPTS_KEY = (poId: string) => ['commerce', 'goods-receipts', poId, 'table'] as const;
export const GOODS_RECEIPTS_TABLE_KEY = ['commerce', 'goods-receipts', 'table'] as const;
export const GOODS_RECEIPT_KEY = (id: string) => ['commerce', 'goods-receipts', id] as const;
export const GOODS_RECEIPT_TREE_KEY = (id: string) => ['commerce', 'goods-receipts', id, 'tree'] as const;

export const GOODS_RECEIPT_INVENTORY_ITEM_IDS_KEY = (id: string) =>
  ['commerce', 'goods-receipts', id, 'inventory-item-ids'] as const;
export const GOODS_RECEIPT_ITEMS_KEY = (id: string) => ['commerce', 'goods-receipts', id, 'items'] as const;
export const GOODS_RECEIPT_ITEMS_TABLE_KEY = (id: string) =>
  ['commerce', 'goods-receipts', id, 'items', 'table'] as const;
export const GOODS_RECEIPT_ITEM_KEY = (id: string, itemId: string) =>
  ['commerce', 'goods-receipts', id, 'items', itemId] as const;

export const GOODS_RECEIPT_LOTS_KEY = (id: string, itemId: string) =>
  ['commerce', 'goods-receipts', id, 'items', itemId, 'lots'] as const;

export const GOODS_RECEIPT_LINES_TABLE_KEY = (id: string, itemId: string) =>
  ['commerce', 'goods-receipts', id, 'items', itemId, 'lines', 'table'] as const;
export const GOODS_RECEIPT_LINES_BY_LOT_TABLE_KEY = (id: string, itemId: string, lotId: string) =>
  ['commerce', 'goods-receipts', id, 'items', itemId, 'lots', lotId, 'lines', 'table'] as const;
export const GOODS_RECEIPT_LINE_KEY = (id: string, itemId: string, lineId: string) =>
  ['commerce', 'goods-receipts', id, 'items', itemId, 'lines', lineId] as const;

export const GOODS_RECEIPT_LINE_ITEMS_TABLE_KEY = (id: string, itemId: string, lineId: string) =>
  ['commerce', 'goods-receipts', id, 'items', itemId, 'lines', lineId, 'items', 'table'] as const;

export const GOODS_RECEIPT_COSTS_KEY = (id: string) => ['commerce', 'goods-receipts', id, 'costs'] as const;
export const GOODS_RECEIPT_COST_ALLOCATIONS_KEY = (id: string, costId: string) =>
  ['commerce', 'goods-receipts', id, 'costs', costId, 'allocations'] as const;
