import type { RouteObject } from 'react-router-dom';
import { StockAdjustmentDetailPage } from './StockAdjustmentDetailPage';
import { StockAdjustmentsPage } from './StockAdjustmentsPage';

const routes: RouteObject[] = [
  { index: true, element: <StockAdjustmentsPage /> },
  { path: ':adjustmentSlug', element: <StockAdjustmentDetailPage /> },
];

export default routes;
