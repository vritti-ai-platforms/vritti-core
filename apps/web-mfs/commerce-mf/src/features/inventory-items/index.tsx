import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { BatchDetailPage } from './BatchDetailPage';
import { InventoryItemDetailPage } from './InventoryItemDetailPage';
import { InventoryItemDetailPageSkeleton } from './InventoryItemDetailPageSkeleton';
import { InventoryItemsPage } from './InventoryItemsPage';

const routes: RouteObject[] = [
  { index: true, element: <InventoryItemsPage /> },
  {
    path: ':itemSlug',
    element: (
      <Suspense fallback={<InventoryItemDetailPageSkeleton />}>
        <InventoryItemDetailPage />
      </Suspense>
    ),
  },
  { path: ':itemSlug/batches/:batchId', element: <BatchDetailPage /> },
];

export default routes;
