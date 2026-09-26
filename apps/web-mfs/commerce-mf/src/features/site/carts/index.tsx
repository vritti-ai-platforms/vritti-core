import { SITE_CARTS } from '@vritti/commerce-permissions/carts';
import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { CartDetailPage } from '@/components/carts/CartDetailPage';
import { CartDetailPageSkeleton } from '@/components/carts/CartDetailPageSkeleton';
import { CartsPage } from '@/components/carts/CartsPage';
import type { CartsBinding } from '@/components/carts/types';
import {
  useAddCartLine,
  useCart,
  useCartItems,
  useCartsTable,
  useCloseCart,
  useOpenCart,
  useRemoveCartLine,
  useUpdateCartLine,
} from '@/hooks/site/carts';

const binding: CartsBinding = {
  scopeNoun: 'outlet',
  description: 'Baskets open at this outlet — one per shopper, plus walk-ins at the till.',
  permissions: SITE_CARTS,
  useCartsTable,
  useCart,
  useCartItems,
  useOpenCart,
  useAddCartLine,
  useUpdateCartLine,
  useRemoveCartLine,
  useCloseCart,
};

const routes: RouteObject[] = [
  { index: true, element: <CartsPage binding={binding} /> },
  {
    path: ':cartId',
    element: (
      <Suspense fallback={<CartDetailPageSkeleton />}>
        <CartDetailPage binding={binding} />
      </Suspense>
    ),
  },
];

export default routes;
