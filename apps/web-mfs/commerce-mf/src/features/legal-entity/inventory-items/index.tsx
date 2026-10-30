import { Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { InventoryItemDetailPage } from './InventoryItemDetailPage';
import { InventoryItemDetailPageSkeleton } from './InventoryItemDetailPageSkeleton';
import { InventoryItemsPage } from './InventoryItemsPage';

const routes: RouteObject[] = [
  { index: true, element: <InventoryItemsPage /> },
  // The item view always opens on a tab, so its bare URL lands on Overview
  { path: ':itemSlug', element: <Navigate to="overview" replace /> },
  {
    path: ':itemSlug/:tab',
    element: (
      <Suspense fallback={<InventoryItemDetailPageSkeleton />}>
        <InventoryItemDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
