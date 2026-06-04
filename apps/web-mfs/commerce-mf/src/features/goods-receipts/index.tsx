import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { GoodsReceiptDetailPage } from './GoodsReceiptDetailPage';
import { GoodsReceiptDetailPageSkeleton } from './GoodsReceiptDetailPageSkeleton';
import { GoodsReceiptsPage } from './GoodsReceiptsPage';

const routes: RouteObject[] = [
  { index: true, element: <GoodsReceiptsPage /> },
  {
    path: ':grSlug',
    element: (
      <Suspense fallback={<GoodsReceiptDetailPageSkeleton />}>
        <GoodsReceiptDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
