import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { CategoriesPage } from './CategoriesPage';
import { CategoriesPageSkeleton } from './CategoriesPageSkeleton';

const routes: RouteObject[] = [
  {
    index: true,
    element: (
      <Suspense fallback={<CategoriesPageSkeleton />}>
        <CategoriesPage />
      </Suspense>
    ),
  },
];

export default routes;
