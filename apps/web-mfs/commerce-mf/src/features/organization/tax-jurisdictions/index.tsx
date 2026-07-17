import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { TaxJurisdictionsPage } from './TaxJurisdictionsPage';
import { TaxJurisdictionsPageSkeleton } from './TaxJurisdictionsPageSkeleton';

const routes: RouteObject[] = [
  {
    index: true,
    element: (
      <Suspense fallback={<TaxJurisdictionsPageSkeleton />}>
        <TaxJurisdictionsPage />
      </Suspense>
    ),
  },
];

export default routes;
