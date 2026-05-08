export const ITEMS_KEY = ['commerce', 'items'] as const;
export const ITEMS_TABLE_KEY = [...ITEMS_KEY, 'table'] as const;
export const ITEMS_TABLE_BY_BU_KEY = (buId: string) => [...ITEMS_TABLE_KEY, buId] as const;

export const ITEM_KEY = ['item'] as const;
export const ITEM_DETAIL_KEY = (id: string) => [...ITEM_KEY, id] as const;
export const ITEM_MODIFIERS_KEY = (itemId: string) => [...ITEM_KEY, itemId, 'modifiers'] as const;
export const ITEM_VARIANTS_KEY = (itemId: string) => [...ITEM_KEY, itemId, 'variants'] as const;
