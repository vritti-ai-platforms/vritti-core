import type { RouteObject } from 'react-router-dom';
import { GoodsReceiptDetailPage } from './GoodsReceiptDetailPage';
import { GoodsReceiptsPage } from './GoodsReceiptsPage';

const routes: RouteObject[] = [
  { index: true, element: <GoodsReceiptsPage /> },
  { path: ':grSlug', element: <GoodsReceiptDetailPage /> },
];

export default routes;
