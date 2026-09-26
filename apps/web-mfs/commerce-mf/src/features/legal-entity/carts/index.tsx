import { LE_CARTS } from '@vritti/commerce-permissions/carts';
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
} from '@/hooks/legal-entity/carts';

const binding: CartsBinding = {
  scopeNoun: 'company',
  description: 'Baskets across this company — its own, and every one its outlets are holding.',
  permissions: LE_CARTS,
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
