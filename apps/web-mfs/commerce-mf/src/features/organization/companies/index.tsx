import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { CompaniesPage } from './CompaniesPage';
import { CompanyDetailPage } from './CompanyDetailPage';
import { CompanyDetailPageSkeleton } from './CompanyDetailPageSkeleton';

const routes: RouteObject[] = [
  { index: true, element: <CompaniesPage /> },
  {
    path: ':companySlug',
    element: (
      <Suspense fallback={<CompanyDetailPageSkeleton />}>
        <CompanyDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
