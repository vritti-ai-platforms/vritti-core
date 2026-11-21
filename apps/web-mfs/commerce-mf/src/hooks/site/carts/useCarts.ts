import { SITE_CARTS } from '@vritti/commerce-permissions/carts';
import { cartsService } from '@/services/site/carts.service';
import { createCartHooks } from './createCartHooks';
import { CART_COUNTS_KEY, CART_ITEMS_KEY, CART_ITEMS_TABLE_KEY, CART_KEY, CARTS_TABLE_KEY } from './keys';

// Baskets at this outlet
export const {
  useCartsTable,
  useCart,
  useCartItems,
  useCartCounts,
  useCartItemsTable,
  useOpenCart,
  useAddCartLine,
  useUpdateCartLine,
  useRemoveCartLine,
  useCloseCart,
} = createCartHooks(
  cartsService,
  {
    table: CARTS_TABLE_KEY,
    cart: CART_KEY,
    counts: CART_COUNTS_KEY,
    items: CART_ITEMS_KEY,
    itemsTable: CART_ITEMS_TABLE_KEY,
  },
  SITE_CARTS.view,
);
