import { parseSlug } from '@vritti/quantum-ui/slug';
import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { SupplierSiteDetailSkeleton } from '@/components/suppliers/SupplierSiteDetailSkeleton';
import { isUuid } from '@/utils/uuid';
import { SupplierDetailPage } from './SupplierDetailPage';
import { SupplierDetailPageSkeleton } from './SupplierDetailPageSkeleton';
import { SupplierItemOverviewRedirect } from './SupplierGrandchildPage';
import { SupplierSitePage } from './SupplierSitePage';

// `…/suppliers/<supplier>/<detail>` — a bare id is a site, a `name~uuid` slug is an item (opened on its Overview),
// and a plain word is a tab of the supplier itself (overview, items, sites)
export const SupplierChildPage = () => {
  const { detail = '' } = useParams();
  if (isUuid(detail)) {
    return (
      <Suspense fallback={<SupplierSiteDetailSkeleton />}>
        <SupplierSitePage />
      </Suspense>
    );
  }
  if (parseSlug(detail)) return <SupplierItemOverviewRedirect />;
  return (
    <Suspense fallback={<SupplierDetailPageSkeleton />}>
      <SupplierDetailPage />
    </Suspense>
  );
};
