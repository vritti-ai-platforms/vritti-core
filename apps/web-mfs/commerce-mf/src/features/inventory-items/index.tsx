import type { RouteObject } from 'react-router-dom';
import { InventoryItemDetailPage } from './InventoryItemDetailPage';
import { InventoryItemsPage } from './InventoryItemsPage';

const routes: RouteObject[] = [
  { index: true, element: <InventoryItemsPage /> },
  { path: ':itemSlug', element: <InventoryItemDetailPage /> },
];

export default routes;
