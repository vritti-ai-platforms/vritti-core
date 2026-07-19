import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { SupplierDetailPage } from './SupplierDetailPage';
import { SupplierDetailPageSkeleton } from './SupplierDetailPageSkeleton';
import { SupplierItemDetailPage } from './SupplierItemDetailPage';
import { SupplierItemDetailPageSkeleton } from './SupplierItemDetailPageSkeleton';
import { SuppliersPage } from './SuppliersPage';

const routes: RouteObject[] = [
  { index: true, element: <SuppliersPage /> },
  {
    path: ':supplierSlug',
    element: (
      <Suspense fallback={<SupplierDetailPageSkeleton />}>
        <SupplierDetailPage />
      </Suspense>
    ),
  },
  {
    path: ':supplierSlug/items/:itemSlug',
    element: (
      <Suspense fallback={<SupplierItemDetailPageSkeleton />}>
        <SupplierItemDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
