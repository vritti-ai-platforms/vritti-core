import { ORG_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PermissionGate, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { CatalogDetailPage } from './CatalogDetailPage';
import { CatalogDetailPageSkeleton } from './CatalogDetailPageSkeleton';
import { CatalogsPage } from './CatalogsPage';

// The gate sits outside the boundary so a denied user never mounts the page and never fires the
// request — useSuspenseQuery has no `enabled`, so the guard cannot live in the hook.
const gated = (permission: string, element: React.ReactNode) => (
  <PermissionGate
    permission={permission}
    fallback={({ reason, title, tip }) => (
      <Empty icon={<PermissionLockIcon reason={reason} />} title={title} description={tip} />
    )}
  >
    <Suspense fallback={<CatalogDetailPageSkeleton />}>{element}</Suspense>
  </PermissionGate>
);

const routes: RouteObject[] = [
  { index: true, element: <CatalogsPage /> },
  { path: ':slug/:tab?', element: gated(ORG_CATALOGS.view, <CatalogDetailPage />) },
];

export default routes;
