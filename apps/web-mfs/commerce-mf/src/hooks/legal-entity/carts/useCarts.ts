import { LE_CARTS } from '@vritti/commerce-permissions/carts';
import { createCartHooks } from '@/hooks/site/carts/createCartHooks';
import { cartsService } from '@/services/legal-entity/carts.service';
import { LE_CART_ITEMS_KEY, LE_CART_KEY, LE_CARTS_TABLE_KEY } from './keys';

/** Baskets across the company — its own, and everything its outlets own. */
export const {
  useCartsTable,
  useCart,
  useCartItems,
  useOpenCart,
  useAddCartLine,
  useUpdateCartLine,
  useRemoveCartLine,
  useCloseCart,
} = createCartHooks(
  cartsService,
  { table: LE_CARTS_TABLE_KEY, cart: LE_CART_KEY, items: LE_CART_ITEMS_KEY },
  LE_CARTS.view,
);
