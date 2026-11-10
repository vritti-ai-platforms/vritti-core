import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { SupplierInvoiceDetailSkeleton } from '@/components/supplier-invoices/SupplierInvoiceDetailSkeleton';
import { SupplierEnrollmentDetailSkeleton } from '@/components/suppliers/SupplierEnrollmentDetailSkeleton';
import { SupplierQuotationPageSkeleton } from '@/components/suppliers/tabs/quotations/SupplierQuotationPageSkeleton';
import { SupplierSiteItemDetailSkeleton } from '@/components/suppliers/tabs/site-items/SupplierSiteItemDetailSkeleton';
import { SupplierDetailPage } from './SupplierDetailPage';
import { SuppliersPage } from './SuppliersPage';
import { SupplierInvoicePage } from './tabs/invoices/SupplierInvoicePage';
import { SupplierQuotationPage } from './tabs/quotations/SupplierQuotationPage';
import { SupplierSiteItemDetailPage } from './tabs/site-items/SupplierSiteItemDetailPage';

const routes: RouteObject[] = [
  { index: true, element: <SuppliersPage /> },
  {
    path: ':supplierSlug',
    element: (
      <Suspense fallback={<SupplierEnrollmentDetailSkeleton />}>
        <SupplierDetailPage />
      </Suspense>
    ),
  },
  {
    path: ':supplierSlug/quotations/:quotationSlug',
    element: (
      <Suspense fallback={<SupplierQuotationPageSkeleton />}>
        <SupplierQuotationPage />
      </Suspense>
    ),
  },
  {
    path: ':supplierSlug/invoices/:invoiceSlug',
    element: (
      <Suspense fallback={<SupplierInvoiceDetailSkeleton />}>
        <SupplierInvoicePage />
      </Suspense>
    ),
  },
  {
    path: ':supplierSlug/site-items/:itemSlug',
    element: (
      <Suspense fallback={<SupplierSiteItemDetailSkeleton />}>
        <SupplierSiteItemDetailPage />
      </Suspense>
    ),
  },
];

export default routes;
