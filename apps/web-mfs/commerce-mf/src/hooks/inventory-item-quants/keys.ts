export const INVENTORY_ITEM_QUANT_KEY = (quantId: string) => ['commerce', 'inventory-item-quants', quantId] as const;
export const INVENTORY_ITEM_QUANT_LEDGER_KEY = (quantId: string) =>
  ['commerce', 'inventory-item-quants', quantId, 'ledger'] as const;
