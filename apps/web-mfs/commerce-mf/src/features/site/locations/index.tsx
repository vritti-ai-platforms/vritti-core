import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { LocationsPage } from './LocationsPage';
import { LocationsPageSkeleton } from './LocationsPageSkeleton';

const routes: RouteObject[] = [
  {
    index: true,
    element: (
      <Suspense fallback={<LocationsPageSkeleton />}>
        <LocationsPage />
      </Suspense>
    ),
  },
];

export default routes;
