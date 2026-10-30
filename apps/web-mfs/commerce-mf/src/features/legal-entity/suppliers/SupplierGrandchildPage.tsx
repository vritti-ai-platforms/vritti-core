import { Suspense } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { SupplierSiteItemDetailSkeleton } from '@/components/suppliers/SupplierSiteItemDetailSkeleton';
import { isUuid } from '@/utils/uuid';
import { SupplierQuotationPage } from './quotations/SupplierQuotationPage';
import { SupplierQuotationPageSkeleton } from './quotations/SupplierQuotationPageSkeleton';
import { SupplierItemDetailPage } from './SupplierItemDetailPage';
import { SupplierItemDetailPageSkeleton } from './SupplierItemDetailPageSkeleton';
import { SupplierSiteItemPage } from './SupplierSiteItemPage';

// `…/suppliers/<supplier>/<detail>/<subDetail>` — under a site (bare id) it is that site's item, under the quotations
// tab it is a quotation, and under an item (`name~uuid` slug) it is the item's tab
export const SupplierGrandchildPage = () => {
  const { detail = '' } = useParams();
  if (detail === 'quotations') {
    return (
      <Suspense fallback={<SupplierQuotationPageSkeleton />}>
        <SupplierQuotationPage />
      </Suspense>
    );
  }
  return isUuid(detail) ? (
    <Suspense fallback={<SupplierSiteItemDetailSkeleton />}>
      <SupplierSiteItemPage />
    </Suspense>
  ) : (
    <Suspense fallback={<SupplierItemDetailPageSkeleton />}>
      <SupplierItemDetailPage />
    </Suspense>
  );
};

// The item view always opens on a tab, so its bare URL lands on Overview
export const SupplierItemOverviewRedirect = () => <Navigate to="overview" replace />;
