import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PeoplePage } from './PeoplePage';
import { PersonDetailPage } from './PersonDetailPage';
import { PersonDetailPageSkeleton } from './PersonDetailPageSkeleton';

const routes: RouteObject[] = [
  { index: true, element: <PeoplePage /> },
  {
    path: ':personSlug',
    element: (
      <Suspense fallback={<PersonDetailPageSkeleton />}>
        <PersonDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
