import { SITE_CARTS } from '@vritti/commerce-permissions/carts';
import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { CartDetailPage } from '@/components/carts/CartDetailPage';
import { CartDetailPageSkeleton } from '@/components/carts/CartDetailPageSkeleton';
import { CartsPage } from '@/components/carts/CartsPage';
import type { CartsBinding } from '@/components/carts/types';
import {
  CART_ITEMS_TABLE_KEY,
  CARTS_TABLE_KEY,
  useAddCartLine,
  useCart,
  useCartItems,
  useCartItemsTable,
  useCartsTable,
  useCloseCart,
  useOpenCart,
  useRemoveCartLine,
  useUpdateCartLine,
} from '@/hooks/site/carts';

const binding: CartsBinding = {
  scopeNoun: 'outlet',
  description: 'Baskets open at this outlet — one per shopper.',
  permissions: SITE_CARTS,
  tableKey: CARTS_TABLE_KEY,
  tableSlug: 'commerce-site-carts',
  itemsTableKey: CART_ITEMS_TABLE_KEY,
  itemsTableSlug: (cartId) => `commerce-site-cart-${cartId}-items`,
  useCartsTable,
  useCart,
  useCartItems,
  useCartItemsTable,
  useOpenCart,
  useAddCartLine,
  useUpdateCartLine,
  useRemoveCartLine,
  useCloseCart,
};

const routes: RouteObject[] = [
  { index: true, element: <CartsPage binding={binding} /> },
  {
    path: ':cartSlug',
    element: (
      <Suspense fallback={<CartDetailPageSkeleton />}>
        <CartDetailPage binding={binding} />
      </Suspense>
    ),
  },
];

export default routes;
