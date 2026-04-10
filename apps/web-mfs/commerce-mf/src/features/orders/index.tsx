import type { RouteObject } from 'react-router-dom';
import { OrderDetailPage } from './OrderDetailPage';
import { OrdersPage } from './OrdersPage';

const routes: RouteObject[] = [
  { index: true, element: <OrdersPage /> },
  { path: ':orderSlug', element: <OrderDetailPage /> },
];

export default routes;
