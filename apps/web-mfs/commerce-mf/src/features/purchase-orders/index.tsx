import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PurchaseOrderDetailPage } from './PurchaseOrderDetailPage';
import { PurchaseOrderDetailPageSkeleton } from './PurchaseOrderDetailPageSkeleton';
import { PurchaseOrdersPage } from './PurchaseOrdersPage';

const routes: RouteObject[] = [
  { index: true, element: <PurchaseOrdersPage /> },
  {
    path: ':poSlug',
    element: (
      <Suspense fallback={<PurchaseOrderDetailPageSkeleton />}>
        <PurchaseOrderDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
