import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { SupplierDetailPage } from './SupplierDetailPage';
import { SupplierDetailPageSkeleton } from './SupplierDetailPageSkeleton';
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
];

export default routes;
