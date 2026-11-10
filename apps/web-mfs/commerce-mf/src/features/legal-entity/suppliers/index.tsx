import { Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { SupplierEnrollmentDetailSkeleton } from '@/components/suppliers/SupplierEnrollmentDetailSkeleton';
import { SupplierQuotationPageSkeleton } from '@/components/suppliers/tabs/quotations/SupplierQuotationPageSkeleton';
import { SupplierDetailPage } from './SupplierDetailPage';
import { SupplierDetailPageSkeleton } from './SupplierDetailPageSkeleton';
import { SuppliersPage } from './SuppliersPage';
import { SupplierEnrollmentPage } from './tabs/enrollments/SupplierEnrollmentPage';
import { SupplierItemDetailPage } from './tabs/items/SupplierItemDetailPage';
import { SupplierItemDetailPageSkeleton } from './tabs/items/SupplierItemDetailPageSkeleton';
import { SupplierQuotationPage } from './tabs/quotations/SupplierQuotationPage';

const routes: RouteObject[] = [
  { index: true, element: <SuppliersPage /> },
  { path: ':supplierSlug', element: <Navigate to="overview" replace /> },
  {
    path: ':supplierSlug/:tab',
    element: (
      <Suspense fallback={<SupplierDetailPageSkeleton />}>
        <SupplierDetailPage />
      </Suspense>
    ),
  },
  {
    path: ':supplierSlug/quotations/:quotationId',
    element: (
      <Suspense fallback={<SupplierQuotationPageSkeleton editable />}>
        <SupplierQuotationPage />
      </Suspense>
    ),
  },
  { path: ':supplierSlug/items/:itemSlug', element: <Navigate to="overview" replace /> },
  {
    path: ':supplierSlug/items/:itemSlug/:tab',
    element: (
      <Suspense fallback={<SupplierItemDetailPageSkeleton />}>
        <SupplierItemDetailPage />
      </Suspense>
    ),
  },
  {
    path: ':supplierSlug/enrollments/:siteSlug',
    element: (
      <Suspense fallback={<SupplierEnrollmentDetailSkeleton />}>
        <SupplierEnrollmentPage />
      </Suspense>
    ),
  },
];

export default routes;
