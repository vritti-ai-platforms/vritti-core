export const CARTS_KEY = ['commerce', 'carts'] as const;
export const CARTS_TABLE_KEY = [...CARTS_KEY, 'table'] as const;

export const CART_KEY = (cartId: string) => [...CARTS_KEY, cartId] as const;
export const CART_ITEMS_KEY = (cartId: string) => [...CART_KEY(cartId), 'items'] as const;
