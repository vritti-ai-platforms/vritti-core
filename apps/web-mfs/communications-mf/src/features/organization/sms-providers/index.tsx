import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { SmsProviderDetailPage } from './SmsProviderDetailPage';
import { SmsProviderDetailPageSkeleton } from './SmsProviderDetailPageSkeleton';
import { SmsProvidersPage } from './SmsProvidersPage';

const routes: RouteObject[] = [
  { index: true, element: <SmsProvidersPage /> },
  {
    // `name~id` rather than a bare id: the host's breadcrumb only swaps a detail crumb for a
    // switcher when the segment parses as a slug, and the readable half is what it falls back to
    // while the switcher's options are still loading. `:tab?` carries the active tab.
    path: ':slug/:tab?',
    element: (
      <Suspense fallback={<SmsProviderDetailPageSkeleton />}>
        <SmsProviderDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
