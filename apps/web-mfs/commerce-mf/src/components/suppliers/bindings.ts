import type { ComponentType } from 'react';
import type {
  SupplierSitePermissions,
  SupplierSiteRef,
  UseAddSitePrice,
  UseDeleteSitePrice,
  UseEnroll,
  UseRemoveEnrollment,
  UseSiteItem,
  UseSiteItemsTable,
  UseSitePriceHistory,
  UseSitePricesTable,
  UseSupplierAtSite,
  UseSupplierRef,
  UseUpdateEnrollment,
  UseUpdateItemTerms,
  UseUpdateSitePrice,
} from './types';

// Everything that differs between the LE and site views of a supplier at one site
export interface SupplierSiteBinding {
  permissions: SupplierSitePermissions;
  // The supplier's quotations posted to the site — a legal-entity tab, absent in a site workspace
  quotations?: { permission: string; Tab: ComponentType<{ supplierId: string; siteId?: string }> };
  // Where the page goes after the supplier is removed from the site (route-relative)
  useExitPath: () => string;
  itemsTableKey: (ref: SupplierSiteRef) => readonly unknown[];
  itemsTableSlug: (ref: SupplierSiteRef) => string;
  pricesTableKey: (ref: SupplierSiteRef, itemId: string) => readonly unknown[];
  pricesTableSlug: (ref: SupplierSiteRef, itemId: string) => string;

  useSupplierRef: UseSupplierRef;
  // The item of a site-item page — its route names the segment differently per workspace
  useItemId: () => string;
  useSupplierAtSite: UseSupplierAtSite;
  useEnroll: UseEnroll;
  useUpdateEnrollment: UseUpdateEnrollment;
  useRemoveEnrollment: UseRemoveEnrollment;

  useSiteItemsTable: UseSiteItemsTable;
  useSiteItem: UseSiteItem;
  useUpdateItemTerms: UseUpdateItemTerms;

  useSitePricesTable: UseSitePricesTable;
  useSitePriceHistory: UseSitePriceHistory;
  useAddSitePrice: UseAddSitePrice;
  useUpdateSitePrice: UseUpdateSitePrice;
  useDeleteSitePrice: UseDeleteSitePrice;
}
