import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { CustomerDetailPage } from './CustomerDetailPage';
import { CustomerDetailPageSkeleton } from './CustomerDetailPageSkeleton';
import { CustomersPage } from './CustomersPage';

const routes: RouteObject[] = [
  { index: true, element: <CustomersPage /> },
  {
    path: ':customerSlug',
    element: (
      <Suspense fallback={<CustomerDetailPageSkeleton />}>
        <CustomerDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
