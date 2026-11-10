import { LE_INBOUND_DELIVERIES } from '@vritti/commerce-permissions/inbound-deliveries';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PermissionGate, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { InboundDeliveryDetailSkeleton } from '@/components/inbound-deliveries/InboundDeliveryDetailSkeleton';
import { InboundDeliveriesPage } from './InboundDeliveriesPage';
import { InboundDeliveryDetailPage } from './InboundDeliveryDetailPage';

const routes: RouteObject[] = [
  { index: true, element: <InboundDeliveriesPage /> },
  {
    path: ':deliverySlug',
    // The gate sits outside the boundary so a denied user never mounts the page and never fires its suspense query
    element: (
      <PermissionGate
        permission={LE_INBOUND_DELIVERIES.view}
        fallback={({ reason, title, tip }) => (
          <Empty icon={<PermissionLockIcon reason={reason} />} title={title} description={tip} />
        )}
      >
        <Suspense fallback={<InboundDeliveryDetailSkeleton />}>
          <InboundDeliveryDetailPage />
        </Suspense>
      </PermissionGate>
    ),
  },
];

export default routes;
