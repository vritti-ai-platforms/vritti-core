import { SITE_CARTS } from '@vritti/commerce-permissions/carts';
import { cartsService } from '@/services/site/carts.service';
import { createCartHooks } from './createCartHooks';
import { CART_ITEMS_KEY, CART_KEY, CARTS_TABLE_KEY } from './keys';

/** Baskets at this outlet. */
export const {
  useCartsTable,
  useCart,
  useCartItems,
  useOpenCart,
  useAddCartLine,
  useUpdateCartLine,
  useRemoveCartLine,
  useCloseCart,
} = createCartHooks(cartsService, { table: CARTS_TABLE_KEY, cart: CART_KEY, items: CART_ITEMS_KEY }, SITE_CARTS.view);
