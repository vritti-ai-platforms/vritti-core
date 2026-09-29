import { LE_CARTS } from '@vritti/commerce-permissions/carts';
import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { CartDetailPage } from '@/components/carts/CartDetailPage';
import { CartDetailPageSkeleton } from '@/components/carts/CartDetailPageSkeleton';
import { CartsPage } from '@/components/carts/CartsPage';
import type { CartsBinding } from '@/components/carts/types';
import {
  LE_CART_ITEMS_TABLE_KEY,
  LE_CARTS_TABLE_KEY,
  useAddCartLine,
  useCart,
  useCartItems,
  useCartItemsTable,
  useCartsTable,
  useCloseCart,
  useOpenCart,
  useRemoveCartLine,
  useUpdateCartLine,
} from '@/hooks/legal-entity/carts';

const binding: CartsBinding = {
  scopeNoun: 'company',
  description: 'Baskets this company holds itself. Outlet baskets live at each outlet.',
  permissions: LE_CARTS,
  tableKey: LE_CARTS_TABLE_KEY,
  tableSlug: 'commerce-le-carts',
  itemsTableKey: LE_CART_ITEMS_TABLE_KEY,
  itemsTableSlug: (cartId) => `commerce-le-cart-${cartId}-items`,
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
