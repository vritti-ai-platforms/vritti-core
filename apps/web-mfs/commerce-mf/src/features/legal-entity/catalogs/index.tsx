import { LE_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PermissionGate, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { CatalogDetailPage } from '@/components/catalogs/CatalogDetailPage';
import { CatalogDetailPageSkeleton } from '@/components/catalogs/CatalogDetailPageSkeleton';
import { CatalogsPage } from '@/components/catalogs/CatalogsPage';
import { leCatalogsBinding } from './binding';

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
  { index: true, element: <CatalogsPage binding={leCatalogsBinding} /> },
  { path: ':slug/:tab?', element: gated(LE_CATALOGS.view, <CatalogDetailPage binding={leCatalogsBinding} />) },
];

export default routes;
