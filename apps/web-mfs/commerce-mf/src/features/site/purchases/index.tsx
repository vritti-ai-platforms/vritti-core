import { SITE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PermissionGate, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
import type React from 'react';
import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PurchaseActivitySkeleton } from '@/components/purchases/activity/PurchaseActivitySkeleton';
import { PurchaseDetailSkeleton } from '@/components/purchases/PurchaseDetailSkeleton';
import { ReceiveWithInvoiceSkeleton } from '@/components/purchases/receive-with-invoices/ReceiveWithInvoiceSkeleton';
import { NewReceiveWithInvoicePage } from './NewReceiveWithInvoicePage';
import { PurchaseActivityPage } from './PurchaseActivityPage';
import { PurchaseDetailPage } from './PurchaseDetailPage';
import { PurchasesPage } from './PurchasesPage';
import { ReceiveWithInvoicePage } from './ReceiveWithInvoicePage';

// The gate sits outside the boundary so a denied user never mounts the page and never fires its suspense query
function gated(permission: string, element: React.ReactNode, skeleton: React.ReactNode) {
  return (
    <PermissionGate
      permission={permission}
      fallback={({ reason, title, tip }) => (
        <Empty icon={<PermissionLockIcon reason={reason} />} title={title} description={tip} />
      )}
    >
      <Suspense fallback={skeleton}>{element}</Suspense>
    </PermissionGate>
  );
}

const routes: RouteObject[] = [
  { index: true, element: <PurchasesPage /> },
  {
    path: 'receive-with-invoices/new',
    element: gated(SITE_PURCHASES.receive, <NewReceiveWithInvoicePage />, <ReceiveWithInvoiceSkeleton />),
  },
  {
    path: 'receive-with-invoices/:invoiceSlug',
    element: gated(SITE_PURCHASES.view, <ReceiveWithInvoicePage />, <ReceiveWithInvoiceSkeleton />),
  },
  {
    path: ':purchaseSlug',
    element: gated(SITE_PURCHASES.view, <PurchaseDetailPage />, <PurchaseDetailSkeleton />),
  },
  {
    path: ':purchaseSlug/activity',
    element: gated(SITE_PURCHASES.view, <PurchaseActivityPage />, <PurchaseActivitySkeleton />),
  },
];

export default routes;
