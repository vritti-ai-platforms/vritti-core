import { Navigate, type RouteObject } from 'react-router-dom';
import { SupplierChildPage } from './SupplierChildPage';
import { SupplierGrandchildPage } from './SupplierGrandchildPage';
import { SuppliersPage } from './SuppliersPage';

const routes: RouteObject[] = [
  { index: true, element: <SuppliersPage /> },
  // The supplier view always opens on a tab, so its bare URL lands on Overview
  { path: ':supplierSlug', element: <Navigate to="overview" replace /> },
  // A tab (plain word), a site (bare id) or an item (`name~uuid` slug) of the supplier — the segment's shape decides
  {
    path: ':supplierSlug/:detail',
    element: <SupplierChildPage />,
  },
  // A site's item (bare-id site) or an item's tab (`name~uuid` item) — the middle segment's shape decides
  {
    path: ':supplierSlug/:detail/:subDetail',
    element: <SupplierGrandchildPage />,
  },
];

export default routes;
