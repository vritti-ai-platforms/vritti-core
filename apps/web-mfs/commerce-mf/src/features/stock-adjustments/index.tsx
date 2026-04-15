import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { StockAdjustmentDetailPage } from './StockAdjustmentDetailPage';
import { StockAdjustmentDetailPageSkeleton } from './StockAdjustmentDetailPageSkeleton';
import { StockAdjustmentsPage } from './StockAdjustmentsPage';

const routes: RouteObject[] = [
  { index: true, element: <StockAdjustmentsPage /> },
  {
    path: ':adjustmentSlug',
    element: (
      <Suspense fallback={<StockAdjustmentDetailPageSkeleton />}>
        <StockAdjustmentDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
