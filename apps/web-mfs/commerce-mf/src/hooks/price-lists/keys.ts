export const PRICE_LISTS_KEY = ['commerce', 'price-lists'] as const;
export const PRICE_LISTS_TABLE_KEY = [...PRICE_LISTS_KEY, 'table'] as const;
export const PRICE_LIST_KEY = [...PRICE_LISTS_KEY, 'detail'] as const;
export const PRICE_LIST_ITEMS_KEY = (priceListId: string) => [...PRICE_LISTS_KEY, 'items', priceListId] as const;
export const TERMINAL_PRICE_LISTS_KEY = (terminalId: string) =>
  [...PRICE_LISTS_KEY, 'terminal-price-lists', terminalId] as const;
export const POS_TERMINAL_SELLABLE_ITEMS_KEY = (terminalId: string) =>
  [...PRICE_LISTS_KEY, 'terminal-sellable-items', terminalId] as const;
export const PRICE_LIST_ITEM_VARIANTS_SELECT_KEY = (search?: string) =>
  [...PRICE_LISTS_KEY, 'item-variants-select', search ?? ''] as const;
