import type { RouteObject } from 'react-router-dom';
import { BatchDetailPage } from './BatchDetailPage';
import { InventoryItemDetailPage } from './InventoryItemDetailPage';
import { InventoryItemsPage } from './InventoryItemsPage';

const routes: RouteObject[] = [
  { index: true, element: <InventoryItemsPage /> },
  { path: ':itemSlug', element: <InventoryItemDetailPage /> },
  { path: ':itemSlug/batches/:batchId', element: <BatchDetailPage /> },
];

export default routes;
