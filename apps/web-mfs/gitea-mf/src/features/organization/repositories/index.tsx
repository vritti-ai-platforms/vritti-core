import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RepositoriesPage } from './RepositoriesPage';
import { RepositoryDetailPage } from './RepositoryDetailPage';
import { RepositoryDetailPageSkeleton } from './RepositoryDetailPageSkeleton';

const routes: RouteObject[] = [
  { index: true, element: <RepositoriesPage /> },
  {
    path: ':repoName',
    element: (
      <Suspense fallback={<RepositoryDetailPageSkeleton />}>
        <RepositoryDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
