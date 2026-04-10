import type { RouteObject } from 'react-router-dom';
import { PurchaseOrderDetailPage } from './PurchaseOrderDetailPage';
import { PurchaseOrdersPage } from './PurchaseOrdersPage';

const routes: RouteObject[] = [
  { index: true, element: <PurchaseOrdersPage /> },
  { path: ':poSlug', element: <PurchaseOrderDetailPage /> },
];

export default routes;
