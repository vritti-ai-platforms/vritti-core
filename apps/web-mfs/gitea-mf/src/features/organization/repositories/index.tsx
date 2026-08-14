import { ORG_REPOSITORIES } from '@vritti/gitea-permissions/repository';
import { PermissionGate } from '@vritti/quantum-ui/PermissionGate';
import { Suspense } from 'react';
import { Navigate, Outlet, type RouteObject } from 'react-router-dom';
import { RepositoriesPage } from './RepositoriesPage';
import { RepositoryDetailPage } from './RepositoryDetailPage';
import { RepositoryDetailPageSkeleton } from './RepositoryDetailPageSkeleton';
import { RunViewPage } from './tabs/actions/RunViewPage';
import { RunViewPageSkeleton } from './tabs/actions/RunViewPageSkeleton';

const routes: RouteObject[] = [
  { index: true, element: <RepositoriesPage /> },
  {
    path: ':repoName',
    // Gated at the route, not inside the pages: useRepository and useRun are suspense queries with no
    // `enabled` to self-gate on, and they run before their page renders any JSX — so a denied user would
    // fire a guarded GET and 403 into the error boundary. Each route carries the code its own suspense
    // query needs: `view` for GET :name, and `actions.runs.view` for the run the run page reads.
    element: (
      <PermissionGate permission={ORG_REPOSITORIES.view}>
        <Outlet />
      </PermissionGate>
    ),
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
        // Nested inside the repository gate, so this only adds the run-specific code — the tab itself is
        // already gated on actions.view by RepositoryDetailPage's Tabs
        path: 'actions/:runSlug',
        element: (
          <PermissionGate permission={ORG_REPOSITORIES.actions.runs.view}>
            <Suspense fallback={<RunViewPageSkeleton />}>
              <RunViewPage />
            </Suspense>
          </PermissionGate>
        ),
      },
    ],
  },
];

export default routes;
