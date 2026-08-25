import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { PermissionGate } from '@vritti/quantum-ui/PermissionGate';
import { Suspense } from 'react';
import { Navigate, Outlet, type RouteObject } from 'react-router-dom';
import { WhatsappAccountDetailPage } from './WhatsappAccountDetailPage';
import { WhatsappAccountDetailPageSkeleton } from './WhatsappAccountDetailPageSkeleton';
import { WhatsappAccountsPage } from './WhatsappAccountsPage';

const routes: RouteObject[] = [
  { index: true, element: <WhatsappAccountsPage /> },
  {
    path: ':accountId',
    // Gated at the route, not inside the page: useWhatsappAccount is a suspense query with no `enabled`
    // to self-gate on, and it runs before the page renders any JSX — so a denied user would fire a
    // guarded GET and 403 into the error boundary.
    element: (
      <PermissionGate permission={ORG_WHATSAPP_ACCOUNTS.view}>
        <Outlet />
      </PermissionGate>
    ),
    children: [
      { index: true, element: <Navigate to="overview" replace /> },
      {
        path: ':accountTab',
        element: (
          <Suspense fallback={<WhatsappAccountDetailPageSkeleton />}>
            <WhatsappAccountDetailPage />
          </Suspense>
        ),
      },
    ],
  },
];

export default routes;
