export const LE_CARTS_KEY = ['commerce', 'le', 'carts'] as const;
export const LE_CARTS_TABLE_KEY = [...LE_CARTS_KEY, 'table'] as const;

export const LE_CART_KEY = (cartId: string) => [...LE_CARTS_KEY, cartId] as const;
export const LE_CART_ITEMS_KEY = (cartId: string) => [...LE_CART_KEY(cartId), 'items'] as const;
