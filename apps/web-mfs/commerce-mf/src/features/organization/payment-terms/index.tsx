import { Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { PaymentTermDetailPage } from './PaymentTermDetailPage';
import { PaymentTermDetailPageSkeleton } from './PaymentTermDetailPageSkeleton';
import { PaymentTermsPage } from './PaymentTermsPage';

const routes: RouteObject[] = [
  { index: true, element: <PaymentTermsPage /> },
  { path: ':paymentTermSlug', element: <Navigate to="overview" replace /> },
  {
    path: ':paymentTermSlug/:tab',
    element: (
      <Suspense fallback={<PaymentTermDetailPageSkeleton />}>
        <PaymentTermDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
