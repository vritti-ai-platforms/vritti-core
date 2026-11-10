import type { FilterCondition } from '@vritti/quantum-ui/types/conditions';
import type { ComponentType } from 'react';
import type { SupplierEnrollmentKey, SupplierEnrollmentRow } from '@/schemas/supplier-enrollments';
import type {
  QuotationPath,
  QuotationRef,
  QuotationSlotProps,
  SupplierEnrollmentPermissions,
  SupplierEnrollmentRef,
  SupplierItemPricesPermissions,
  SupplierSiteItemPagePermissions,
  UseAddSitePrice,
  UseCreateEnrollment,
  UseDeleteEnrollment,
  UseDeletePrice,
  UseEnrollment,
  UseEnrollmentRef,
  UseEnrollmentScope,
  UseEnrollmentsTable,
  UsePriceHistoryQuery,
  UsePricesTable,
  UseQuotation,
  UseQuotationsTable,
  UseSetEnrollmentActive,
  UseSiteItem,
  UseSiteItemsTable,
  UseSupplierParty,
  UseUpdateEnrollment,
  UseUpdatePrice,
  UseUpdateSiteItem,
} from './types';

// The enrollments table: one supplier across the legal entity's sites, or one site across its suppliers
export interface EnrollmentsTableBinding {
  // The side of the (supplier, site) pair the rows vary over
  rows: 'sites' | 'suppliers';
  // The fixed side of every row: the supplier of an LE supplier page, the session site in a site workspace
  useScope: UseEnrollmentScope;
  useTable: UseEnrollmentsTable;
  queryKey: (scope: Partial<SupplierEnrollmentKey>) => readonly unknown[];
  slug: (scope: Partial<SupplierEnrollmentKey>) => string;
  // A row's enrollment page, relative to the table's URL path
  rowPath: (row: SupplierEnrollmentRow) => string;
}

// A supplier item's prices table and price history: at LE across the sites it is priced at, in a site workspace at
// the session site
export interface SupplierItemPricesBinding {
  permissions: SupplierItemPricesPermissions;
  tableKey: (supplierId: string, itemId: string) => readonly unknown[];
  tableSlug: (supplierId: string, itemId: string) => string;
  usePricesTable: UsePricesTable;
  usePriceHistoryQuery: UsePriceHistoryQuery;
  priceHistoryKey: (supplierId: string, itemId: string) => readonly unknown[];
  priceHistorySlug: (supplierId: string, itemId: string) => string;
  useUpdatePrice: UseUpdatePrice;
  useDeletePrice: UseDeletePrice;
  spansSites?: boolean;
}

// A site workspace's own supplier site item page, where the site's terms and prices for the item live. At LE the
// supplier item page owns every site's data, so an enrollment's site items only link there.
export interface SupplierSiteItemPageBinding {
  permissions: SupplierSiteItemPagePermissions;
  useItemId: () => string;
  useSiteItem: UseSiteItem;
  useUpdateSiteItem: UseUpdateSiteItem;
  prices: SupplierItemPricesBinding;
  useAddSitePrice: UseAddSitePrice;
}

export interface SiteItemTableContext {
  tableSlug: string;
  queryKey: readonly unknown[];
  context: FilterCondition[];
}

export interface SupplierEnrollmentBinding {
  permissions: SupplierEnrollmentPermissions;
  table: EnrollmentsTableBinding;
  // The supplier's quotations posted to the enrollment's site
  quotations: SupplierQuotationsBinding;
  // Where the enrollment page goes after the enrollment is removed (route-relative)
  useExitPath: () => string;
  siteItemsTableKey: (ref: SupplierEnrollmentRef) => readonly unknown[];
  siteItemsTableSlug: (ref: SupplierEnrollmentRef) => string;

  useEnrollmentRef: UseEnrollmentRef;
  useEnrollment: UseEnrollment;
  // The supplier's party facts for the enrollment forms; idle until the supplier is known
  useSupplierParty: UseSupplierParty;
  useCreateEnrollment: UseCreateEnrollment;
  useUpdateEnrollment: UseUpdateEnrollment;
  useSetEnrollmentActive: UseSetEnrollmentActive;
  useDeleteEnrollment: UseDeleteEnrollment;

  useSiteItemsTable: UseSiteItemsTable;
  useUpdateSiteItem: UseUpdateSiteItem;
  // Where an enrollment's site item opens, relative to the enrollment page's URL path
  siteItemPath: (itemSlug: string, ref: SupplierEnrollmentRef) => string;
  // The table the site item opens on and the context it opens at, written into that table's saved state first
  siteItemTableContext?: (itemId: string, ref: SupplierEnrollmentRef) => SiteItemTableContext;
  // Present only where the workspace has its own supplier site item page
  siteItemPage?: SupplierSiteItemPageBinding;
  invoices?: SupplierEnrollmentInvoicesBinding;
}

export interface SupplierEnrollmentInvoicesBinding {
  permission: string;
  Tab: ComponentType<{ supplierId: string }>;
}

// A supplier's quotations — the list, a supplier's or those posted to one site, and a quotation's page. A site workspace
// only reads them; the legal entity also records, edits and posts them through `authoring`.
export interface SupplierQuotationsBinding {
  // view: a supplier's quotations; siteView: those posted to a site; mrpView: the MRP column on a quotation's lines
  permissions: { view: string; siteView: string; mrpView: string };
  useTable: UseQuotationsTable;
  tableKey: (supplierId: string, siteId: string | undefined) => readonly unknown[];
  tableSlug: (supplierId: string, siteId: string | undefined) => string;
  // A quotation's page, relative to the list's URL path
  useQuotationPath: (siteId: string | undefined) => QuotationPath;
  emptyState: (siteId: string | undefined) => { title: string; description: string };
  useQuotationRef: () => QuotationRef;
  useQuotation: UseQuotation;
  quotationKey: (supplierId: string, quotationId: string) => readonly unknown[];
  useSupplierName: (supplierId: string) => string;
  authoring?: SupplierQuotationAuthoring;
}

// Recording a supplier's quotations, editing their lines and posting them to sites — the legal entity's alone
export interface SupplierQuotationAuthoring {
  // The list's toolbar action: a new quotation on a supplier's list, the way to it from a site's list
  ListAction: ComponentType<{ supplierId: string; siteId?: string; quotationPath: QuotationPath }>;
  HeaderActions: ComponentType<QuotationSlotProps>;
  LinesTab: ComponentType<QuotationSlotProps>;
  SitesTab: ComponentType<QuotationSlotProps>;
  DeleteZone: ComponentType<QuotationSlotProps>;
}
