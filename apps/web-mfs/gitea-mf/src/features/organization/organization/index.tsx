import { ORG_ORGANIZATION } from '@vritti/gitea-permissions/organization';
import { PermissionGate } from '@vritti/quantum-ui/PermissionGate';
import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { OrganizationPage } from './OrganizationPage';
import { OrganizationPageSkeleton } from './OrganizationPageSkeleton';

const routes: RouteObject[] = [
  {
    index: true,
    // Gated at the route, not inside the page: useGiteaOrganization is a suspense query with no `enabled`
    // to self-gate on, and it runs before the page renders any JSX — so a denied user would fire a
    // view-guarded GET and 403 into the error boundary. The gate keeps the page unmounted instead.
    element: (
      <PermissionGate permission={ORG_ORGANIZATION.view}>
        <Suspense fallback={<OrganizationPageSkeleton />}>
          <OrganizationPage />
        </Suspense>
      </PermissionGate>
    ),
  },
];

export default routes;
