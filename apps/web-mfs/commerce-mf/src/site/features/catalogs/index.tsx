import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { CatalogDetailPage } from './CatalogDetailPage';
import { CatalogDetailPageSkeleton } from './CatalogDetailPageSkeleton';
import { CatalogsPage } from './CatalogsPage';
import { OfferingDetailPage } from './OfferingDetailPage';
import { OfferingDetailPageSkeleton } from './OfferingDetailPageSkeleton';

const routes: RouteObject[] = [
  { index: true, element: <CatalogsPage /> },
  {
    path: ':catalogSlug',
    element: (
      <Suspense fallback={<CatalogDetailPageSkeleton />}>
        <CatalogDetailPage />
      </Suspense>
    ),
  },
  {
    path: ':catalogSlug/:offeringSlug',
    element: (
      <Suspense fallback={<OfferingDetailPageSkeleton />}>
        <OfferingDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
