export const INVENTORY_ITEM_BATCH_KEY = (batchId: string) => ['commerce', 'inventory-item-batches', batchId] as const;
export const INVENTORY_ITEM_BATCH_LEDGER_KEY = (batchId: string) => ['commerce', 'inventory-item-batches', batchId, 'ledger'] as const;
