import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import type { SupplierSiteBinding } from '@/components/suppliers/bindings';
import {
  SITE_SUPPLIER_ITEM_PRICES_TABLE_KEY,
  SITE_SUPPLIER_ITEMS_TABLE_KEY,
  useAddSiteSupplierViewPrice,
  useDeleteSiteSupplierViewPrice,
  useEnrollSiteSupplierView,
  useRemoveSiteSupplierEnrollment,
  useSiteSupplierAtSite,
  useSiteSupplierRef,
  useSiteSupplierViewItem,
  useSiteSupplierViewItemsTable,
  useSiteSupplierViewPriceHistory,
  useSiteSupplierViewPricesTable,
  useUpdateSiteSupplierEnrollment,
  useUpdateSiteSupplierItemTerms,
  useUpdateSiteSupplierViewPrice,
} from '@/hooks/site/suppliers';

// The site item route is `…/<supplier>/<itemSlug>`
function useSiteItemId(): string {
  return useSlugParams('itemSlug').id;
}

// Back to the site's suppliers list after the supplier is removed from the site
function useSuppliersListPath(): string {
  return '..';
}

export const binding: SupplierSiteBinding = {
  permissions: {
    view: SITE_SUPPLIERS.view,
    enroll: SITE_SUPPLIERS.enroll,
    editEnroll: SITE_SUPPLIERS.editEnroll,
    unenroll: SITE_SUPPLIERS.unenroll,
    mrp: SITE_INVENTORY_ITEMS.mrp,
    items: { view: SITE_SUPPLIERS.items.view, edit: SITE_SUPPLIERS.items.terms.edit },
    prices: SITE_SUPPLIERS.items.prices,
  },
  itemsTableKey: (ref) => SITE_SUPPLIER_ITEMS_TABLE_KEY(ref.supplierId),
  itemsTableSlug: (ref) => `commerce-site-supplier-${ref.supplierId}-items`,
  pricesTableKey: (ref, itemId) => SITE_SUPPLIER_ITEM_PRICES_TABLE_KEY(ref.supplierId, itemId),
  pricesTableSlug: (_ref, itemId) => `commerce-site-supplier-item-${itemId}-prices`,

  useSupplierRef: useSiteSupplierRef,
  useItemId: useSiteItemId,
  useExitPath: useSuppliersListPath,
  useSupplierAtSite: useSiteSupplierAtSite,
  useEnroll: useEnrollSiteSupplierView,
  useUpdateEnrollment: useUpdateSiteSupplierEnrollment,
  useRemoveEnrollment: useRemoveSiteSupplierEnrollment,

  useSiteItemsTable: useSiteSupplierViewItemsTable,
  useSiteItem: useSiteSupplierViewItem,
  useUpdateItemTerms: useUpdateSiteSupplierItemTerms,

  useSitePricesTable: useSiteSupplierViewPricesTable,
  useSitePriceHistory: useSiteSupplierViewPriceHistory,
  useAddSitePrice: useAddSiteSupplierViewPrice,
  useUpdateSitePrice: useUpdateSiteSupplierViewPrice,
  useDeleteSitePrice: useDeleteSiteSupplierViewPrice,
};
