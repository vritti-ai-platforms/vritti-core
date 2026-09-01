import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { SmsProviderDetailPage } from './SmsProviderDetailPage';
import { SmsProviderDetailPageSkeleton } from './SmsProviderDetailPageSkeleton';
import { SmsProvidersPage } from './SmsProvidersPage';

const routes: RouteObject[] = [
  { index: true, element: <SmsProvidersPage /> },
  {
    path: ':providerId',
    element: (
      <Suspense fallback={<SmsProviderDetailPageSkeleton />}>
        <SmsProviderDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
