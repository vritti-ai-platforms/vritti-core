export const GOODS_RECEIPTS_KEY = ['commerce', 'goods-receipts'] as const;
export const GOODS_RECEIPTS_TABLE_KEY = [...GOODS_RECEIPTS_KEY, 'table'] as const;
export const GOODS_RECEIPT_KEY = (id: string) => [...GOODS_RECEIPTS_KEY, id] as const;
export const GOODS_RECEIPT_COUNTS_KEY = (id: string) => [...GOODS_RECEIPT_KEY(id), 'counts'] as const;
export const GOODS_RECEIPT_TREE_KEY = (id: string) => [...GOODS_RECEIPT_KEY(id), 'tree'] as const;
export const GOODS_RECEIPT_ITEMS_COST_KEY = (id: string) => [...GOODS_RECEIPT_KEY(id), 'items-cost'] as const;
export const GOODS_RECEIPT_ITEM_KEY = (id: string, itemId: string) =>
  [...GOODS_RECEIPT_KEY(id), 'items', itemId] as const;
export const GOODS_RECEIPT_ITEM_QUANTS_KEY = (id: string, itemId: string) =>
  [...GOODS_RECEIPT_ITEM_KEY(id, itemId), 'quants'] as const;
export const GOODS_RECEIPT_LOTS_KEY = (id: string, itemId: string) =>
  [...GOODS_RECEIPT_ITEM_KEY(id, itemId), 'lots'] as const;
export const GOODS_RECEIPT_LINES_TABLE_KEY = (id: string, itemId: string) =>
  [...GOODS_RECEIPT_ITEM_KEY(id, itemId), 'lines', 'table'] as const;
export const GOODS_RECEIPT_LOT_LINES_TABLE_KEY = (id: string, itemId: string, lotId: string) =>
  [...GOODS_RECEIPT_LOTS_KEY(id, itemId), lotId, 'lines', 'table'] as const;
export const GOODS_RECEIPT_LINE_KEY = (id: string, itemId: string, lineId: string) =>
  [...GOODS_RECEIPT_ITEM_KEY(id, itemId), 'lines', lineId] as const;
export const GOODS_RECEIPT_LINE_ITEMS_TABLE_KEY = (id: string, itemId: string, lineId: string) =>
  [...GOODS_RECEIPT_LINE_KEY(id, itemId, lineId), 'items', 'table'] as const;
