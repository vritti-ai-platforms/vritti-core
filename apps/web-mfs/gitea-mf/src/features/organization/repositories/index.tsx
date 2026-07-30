import { Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { RepositoriesPage } from './RepositoriesPage';
import { RepositoryDetailPage } from './RepositoryDetailPage';
import { RepositoryDetailPageSkeleton } from './RepositoryDetailPageSkeleton';
import { RunViewPage } from './RunViewPage';
import { RunViewPageSkeleton } from './RunViewPageSkeleton';

const routes: RouteObject[] = [
  { index: true, element: <RepositoriesPage /> },
  {
    path: ':repoName',
    children: [
      { index: true, element: <Navigate to="overview" replace /> },
      // `actions/:runId` outranks `:repoTab` because its first segment is static
      {
        path: ':repoTab',
        element: (
          <Suspense fallback={<RepositoryDetailPageSkeleton />}>
            <RepositoryDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'actions/:runId',
        element: (
          <Suspense fallback={<RunViewPageSkeleton />}>
            <RunViewPage />
          </Suspense>
        ),
      },
    ],
  },
];

export default routes;
