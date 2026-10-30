import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { SupplierSiteDetailSkeleton } from '@/components/suppliers/SupplierSiteDetailSkeleton';
import { SupplierSiteItemDetailSkeleton } from '@/components/suppliers/SupplierSiteItemDetailSkeleton';
import { SupplierDetailPage } from './SupplierDetailPage';
import { SupplierItemDetailPage } from './SupplierItemDetailPage';
import { SuppliersPage } from './SuppliersPage';

const routes: RouteObject[] = [
  { index: true, element: <SuppliersPage /> },
  {
    path: ':supplierSlug',
    element: (
      <Suspense fallback={<SupplierSiteDetailSkeleton />}>
        <SupplierDetailPage />
      </Suspense>
    ),
  },
  {
    path: ':supplierSlug/:itemSlug',
    element: (
      <Suspense fallback={<SupplierSiteItemDetailSkeleton />}>
        <SupplierItemDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
