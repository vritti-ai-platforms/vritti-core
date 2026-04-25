export const GOODS_RECEIPTS_KEY = (poId: string) => ['commerce', 'goods-receipts', poId, 'table'] as const;
export const GOODS_RECEIPTS_TABLE_KEY = ['commerce', 'goods-receipts', 'table'] as const;
export const GOODS_RECEIPT_KEY = (id: string) => ['commerce', 'goods-receipts', id] as const;
export const GOODS_RECEIPT_ITEMS_KEY = (id: string) => ['commerce', 'goods-receipts', id, 'items'] as const;
export const GOODS_RECEIPT_ITEMS_TABLE_KEY = (id: string) => ['commerce', 'goods-receipts', id, 'items', 'table'] as const;
export const GOODS_RECEIPT_INVENTORY_ITEM_IDS_KEY = (id: string) => ['commerce', 'goods-receipts', id, 'lines', 'inventory-item-ids'] as const;
export const GOODS_RECEIPT_ITEM_KEY = (id: string, itemId: string) => ['commerce', 'goods-receipts', id, 'items', itemId] as const;
export const GOODS_RECEIPT_BATCHES_KEY = (id: string, itemId: string) => ['commerce', 'goods-receipts', id, 'items', itemId, 'batches'] as const;
export const GOODS_RECEIPT_BATCH_ITEMS_KEY = (id: string, itemId: string, batchId: string) => ['commerce', 'goods-receipts', id, 'items', itemId, 'batches', batchId, 'items'] as const;
