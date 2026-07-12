import type { RouteObject } from 'react-router-dom';
import { StockTransferDetailPage } from './StockTransferDetailPage';
import { StockTransfersPage } from './StockTransfersPage';

const routes: RouteObject[] = [
  { index: true, element: <StockTransfersPage /> },
  { path: ':transferSlug', element: <StockTransferDetailPage /> },
];

export default routes;
