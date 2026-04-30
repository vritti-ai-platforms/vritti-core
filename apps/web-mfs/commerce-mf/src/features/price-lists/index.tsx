import type { RouteObject } from 'react-router-dom';
import { PriceListDetailPage } from './PriceListDetailPage';
import { PriceListsPage } from './PriceListsPage';

const routes: RouteObject[] = [
  { index: true, element: <PriceListsPage /> },
  { path: ':priceListSlug', element: <PriceListDetailPage /> },
];

export default routes;
