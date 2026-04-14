import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { StorageLocationsPage } from './StorageLocationsPage';
import { StorageLocationsPageSkeleton } from './StorageLocationsPageSkeleton';

const routes: RouteObject[] = [
  {
    index: true,
    element: (
      <Suspense fallback={<StorageLocationsPageSkeleton />}>
        <StorageLocationsPage />
      </Suspense>
    ),
  },
];

export default routes;
