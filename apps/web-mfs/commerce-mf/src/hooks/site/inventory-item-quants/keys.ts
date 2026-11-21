export const INVENTORY_ITEM_QUANTS_KEY = ['commerce', 'inventory-item-quants'] as const;
export const INVENTORY_ITEM_QUANT_KEY = (quantId: string) => [...INVENTORY_ITEM_QUANTS_KEY, quantId] as const;
