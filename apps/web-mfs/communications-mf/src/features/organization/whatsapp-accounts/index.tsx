import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { WhatsappAccountDetailPage } from './WhatsappAccountDetailPage';
import { WhatsappAccountDetailPageSkeleton } from './WhatsappAccountDetailPageSkeleton';
import { WhatsappAccountsPage } from './WhatsappAccountsPage';

const routes: RouteObject[] = [
  { index: true, element: <WhatsappAccountsPage /> },
  {
    path: ':accountId',
    element: (
      <Suspense fallback={<WhatsappAccountDetailPageSkeleton />}>
        <WhatsappAccountDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
