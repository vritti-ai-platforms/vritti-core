import { Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { TaxClassDetailPage } from './TaxClassDetailPage';
import { TaxClassDetailPageSkeleton } from './TaxClassDetailPageSkeleton';
import { TaxClassesPage } from './TaxClassesPage';

const routes: RouteObject[] = [
  { index: true, element: <TaxClassesPage /> },
  { path: ':taxClassSlug', element: <Navigate to="overview" replace /> },
  {
    path: ':taxClassSlug/:tab',
    element: (
      <Suspense fallback={<TaxClassDetailPageSkeleton />}>
        <TaxClassDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
