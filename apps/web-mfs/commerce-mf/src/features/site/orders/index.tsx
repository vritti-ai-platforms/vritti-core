import { SITE_ORDERS } from '@vritti/commerce-permissions/orders';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PermissionGate, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
import type React from 'react';
import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { OrderDetailPage } from './OrderDetailPage';
import { OrderDetailPageSkeleton } from './OrderDetailPageSkeleton';
import { OrdersPage } from './OrdersPage';

// The gate sits outside the boundary so a denied user never mounts the page and never fires its suspense query
function gated(permission: string, element: React.ReactNode, skeleton?: React.ReactNode) {
  return (
    <PermissionGate
      permission={permission}
      fallback={({ reason, title, tip }) => (
        <Empty icon={<PermissionLockIcon reason={reason} />} title={title} description={tip} />
      )}
    >
      {skeleton ? <Suspense fallback={skeleton}>{element}</Suspense> : element}
    </PermissionGate>
  );
}

const routes: RouteObject[] = [
  { index: true, element: gated(SITE_ORDERS.view, <OrdersPage />) },
  { path: ':orderSlug', element: gated(SITE_ORDERS.view, <OrderDetailPage />, <OrderDetailPageSkeleton />) },
];

export default routes;
