import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import type {
  SupplierEnrollmentBinding,
  SupplierItemPricesBinding,
  SupplierQuotationsBinding,
  SupplierSiteItemPageBinding,
} from '@/components/suppliers/bindings';
import type { QuotationRef } from '@/components/suppliers/types';
import {
  useCreateSupplierEnrollment,
  useDeleteSupplierEnrollment,
  useSetSupplierEnrollmentActive,
  useSupplierEnrollment,
  useSupplierEnrollmentLookup,
  useSupplierEnrollmentRef,
  useSupplierEnrollmentSiteItemsTable,
  useSupplierEnrollmentsTable,
  useUpdateSupplierEnrollment,
} from '@/hooks/site/supplier-enrollments';
import {
  SITE_SUPPLIER_QUOTATION_KEY,
  SITE_SUPPLIER_QUOTATIONS_TABLE_KEY,
  useSupplierQuotation,
  useSupplierQuotationsTable,
} from '@/hooks/site/supplier-quotations';
import {
  SITE_SUPPLIER_SITE_ITEM_PRICE_HISTORY_KEY,
  SITE_SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY,
  SITE_SUPPLIER_SITE_ITEMS_TABLE_KEY,
  SITE_SUPPLIERS_TABLE_KEY,
  useAddSupplierSiteItemPrice,
  useDeleteSupplierSiteItemPrice,
  useSupplierSiteItem,
  useSupplierSiteItemPriceHistoryQuery,
  useSupplierSiteItemPricesTable,
  useUpdateSupplierSiteItem,
  useUpdateSupplierSiteItemPrice,
} from '@/hooks/site/suppliers';
import { useSiteId } from '@/hooks/site/useSiteId';
import type { SupplierEnrollmentKey, SupplierParty } from '@/schemas/supplier-enrollments';
import type { SupplierQuotationData } from '@/schemas/supplier-quotations';
import { InvoicesTab } from './tabs/invoices/InvoicesTab';

// The site item route is `…/<supplier>/site-items/<itemSlug>`
function useSiteItemId(): string {
  return useSlugParams('itemSlug').id;
}

// The supplier route is `<supplier>`, so a quotation's page is `quotations/<number~id>` below it
function quotationPath(quotation: Pick<SupplierQuotationData, 'id' | 'quotationNumber'>): string {
  return `quotations/${buildSlug(quotation.quotationNumber, quotation.id)}`;
}

// The site's list is always the session site's, so the site argument is not sent
function useQuotationsTable(supplierId: string) {
  return useSupplierQuotationsTable(supplierId);
}

// The quotation route is `<supplier>/quotations/<number~id>`
function useQuotationRef(): QuotationRef {
  return { supplierId: useSlugParams('supplierSlug').id, quotationId: useSlugParams('quotationSlug').id };
}

function useSupplierName(supplierId: string): string {
  return useSupplierEnrollment({ supplierId, siteId: useSiteId() }).data.partyName;
}

// Back to the site's suppliers list after the supplier is unenrolled from the site
function useSuppliersListPath(): string {
  return '..';
}

// The session site every row of the site's suppliers list shares
function useSiteScope(): Partial<SupplierEnrollmentKey> {
  return { siteId: useSiteId() };
}

function useEnrollmentsTable() {
  return useSupplierEnrollmentsTable();
}

// The supplier as the site sees it carries its party, tax ID and default payment term
function useSupplierParty(supplierId: string | undefined): SupplierParty | undefined {
  return useSupplierEnrollmentLookup(supplierId).data;
}

// The session site's prices; the site is the workspace's, so no site is sent
function usePricesTable(supplierId: string, itemId: string) {
  return useSupplierSiteItemPricesTable(supplierId, itemId);
}

const pricesBinding: SupplierItemPricesBinding = {
  permissions: { ...SITE_SUPPLIERS.siteItems.prices, mrp: SITE_INVENTORY_ITEMS.mrp },
  tableKey: SITE_SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY,
  tableSlug: (_supplierId, itemId) => `commerce-site-supplier-item-${itemId}-prices`,
  usePricesTable,
  usePriceHistoryQuery: useSupplierSiteItemPriceHistoryQuery,
  priceHistoryKey: SITE_SUPPLIER_SITE_ITEM_PRICE_HISTORY_KEY,
  priceHistorySlug: (_supplierId, itemId) => `commerce-site-supplier-item-${itemId}-price-history`,
  useUpdatePrice: useUpdateSupplierSiteItemPrice,
  useDeletePrice: useDeleteSupplierSiteItemPrice,
};

// The site's supplier site item API is addressed by the site item alone, so the supplier item id isn't needed
function useUpdateSiteSupplierSiteItem(
  supplierId: string,
  _itemId: string,
  options?: Parameters<typeof useUpdateSupplierSiteItem>[1],
) {
  return useUpdateSupplierSiteItem(supplierId, options);
}

export const siteItemPage: SupplierSiteItemPageBinding = {
  permissions: { editTerms: SITE_SUPPLIERS.siteItems.terms.edit },
  useItemId: useSiteItemId,
  useSiteItem: useSupplierSiteItem,
  useUpdateSiteItem: useUpdateSiteSupplierSiteItem,
  prices: pricesBinding,
  useAddSitePrice: useAddSupplierSiteItemPrice,
};

// The supplier's quotations posted to this site, read-only; the legal entity records and posts them
export const quotationsBinding: SupplierQuotationsBinding = {
  permissions: {
    view: SITE_SUPPLIERS.quotations.view,
    siteView: SITE_SUPPLIERS.quotations.view,
    mrpView: SITE_INVENTORY_ITEMS.mrp.view,
  },
  useTable: useQuotationsTable,
  tableKey: (supplierId) => SITE_SUPPLIER_QUOTATIONS_TABLE_KEY(supplierId),
  tableSlug: (supplierId) => `commerce-site-supplier-${supplierId}-quotations`,
  useQuotationPath: () => quotationPath,
  emptyState: () => ({
    title: 'No quotations',
    description: "None of the supplier's quotations is posted to this site yet.",
  }),
  useQuotationRef,
  useQuotation: useSupplierQuotation,
  quotationKey: SITE_SUPPLIER_QUOTATION_KEY,
  useSupplierName,
};

export const binding: SupplierEnrollmentBinding = {
  permissions: {
    view: SITE_SUPPLIERS.view,
    enroll: SITE_SUPPLIERS.enroll,
    editEnroll: SITE_SUPPLIERS.editEnroll,
    unenroll: SITE_SUPPLIERS.unenroll,
    siteItems: { view: SITE_SUPPLIERS.siteItems.view, edit: SITE_SUPPLIERS.siteItems.terms.edit },
  },
  table: {
    rows: 'suppliers',
    useScope: useSiteScope,
    useTable: useEnrollmentsTable,
    queryKey: () => SITE_SUPPLIERS_TABLE_KEY,
    slug: () => 'commerce-site-suppliers',
    rowPath: (row) => buildSlug(row.partyName, row.supplierId),
  },
  quotations: quotationsBinding,
  siteItemsTableKey: (ref) => SITE_SUPPLIER_SITE_ITEMS_TABLE_KEY(ref.supplierId),
  siteItemsTableSlug: (ref) => `commerce-site-supplier-${ref.supplierId}-site-items`,

  useEnrollmentRef: useSupplierEnrollmentRef,
  useExitPath: useSuppliersListPath,
  useEnrollment: useSupplierEnrollment,
  useSupplierParty,
  useCreateEnrollment: useCreateSupplierEnrollment,
  useUpdateEnrollment: useUpdateSupplierEnrollment,
  useSetEnrollmentActive: useSetSupplierEnrollmentActive,
  useDeleteEnrollment: useDeleteSupplierEnrollment,

  useSiteItemsTable: useSupplierEnrollmentSiteItemsTable,
  useUpdateSiteItem: useUpdateSiteSupplierSiteItem,
  // The supplier route is `<supplier>`, so a site item's page is `site-items/<itemSlug>` below it
  siteItemPath: (itemSlug) => `site-items/${itemSlug}`,
  siteItemPage,
  invoices: { permission: SITE_SUPPLIERS.invoices.view, Tab: InvoicesTab },
};
