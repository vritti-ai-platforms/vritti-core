import type { RouteObject } from 'react-router-dom';
import { SupplierDetailPage } from './SupplierDetailPage';
import { SuppliersPage } from './SuppliersPage';

const routes: RouteObject[] = [
  { index: true, element: <SuppliersPage /> },
  { path: ':supplierSlug', element: <SupplierDetailPage /> },
];

export default routes;
