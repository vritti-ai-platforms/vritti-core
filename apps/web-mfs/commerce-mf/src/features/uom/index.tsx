import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { UomPage } from './UomPage';
import { UomPageSkeleton } from './UomPageSkeleton';

const routes: RouteObject[] = [
  {
    index: true,
    element: (
      <Suspense fallback={<UomPageSkeleton />}>
        <UomPage />
      </Suspense>
    ),
  },
];

export default routes;
