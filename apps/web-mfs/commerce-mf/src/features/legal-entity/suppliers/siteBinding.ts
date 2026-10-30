import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { useParams } from 'react-router-dom';
import type { SupplierSiteBinding } from '@/components/suppliers/bindings';
import {
  SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY,
  SUPPLIER_SITE_ITEMS_TABLE_KEY,
  useAddSupplierSiteItemPrice,
  useDeleteSupplierSiteItemPrice,
  useEnrollSupplierSite,
  useRemoveSupplierSiteEnrollment,
  useSupplierAtSite,
  useSupplierSiteItem,
  useSupplierSiteItemPriceHistory,
  useSupplierSiteItemPricesTable,
  useSupplierSiteItemsTable,
  useSupplierSiteRef,
  useUpdateSupplierSiteEnrollment,
  useUpdateSupplierSiteItemPrice,
  useUpdateSupplierSiteItemTerms,
} from '@/hooks/legal-entity/suppliers';
import { QuotationsTab } from './tabs/QuotationsTab';

// The site item route is `…/<supplier>/<siteId>/<subDetail>`
function useSiteItemId(): string {
  return useSlugParams('subDetail').id;
}

// Back to the Sites tab of the supplier the site view was opened from
function useSupplierExitPath(): string {
  const { supplierSlug } = useParams();
  return `../${supplierSlug}/sites`;
}

export const siteBinding: SupplierSiteBinding = {
  permissions: {
    view: LE_SUPPLIERS.sites.view,
    enroll: LE_SUPPLIERS.sites.enroll,
    editEnroll: LE_SUPPLIERS.sites.editEnroll,
    unenroll: LE_SUPPLIERS.sites.unenroll,
    mrp: LE_INVENTORY_ITEMS.mrp,
    items: { view: LE_SUPPLIERS.sites.items.view, edit: LE_SUPPLIERS.sites.items.edit },
    prices: LE_SUPPLIERS.items.prices,
  },
  quotations: { permission: LE_SUPPLIERS.sites.quotations.view, Tab: QuotationsTab },
  itemsTableKey: (ref) => SUPPLIER_SITE_ITEMS_TABLE_KEY(ref.supplierId, ref.siteId ?? ''),
  itemsTableSlug: (ref) => `commerce-le-supplier-${ref.supplierId}-site-${ref.siteId}-items`,
  pricesTableKey: (ref, itemId) => SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY(ref.supplierId, ref.siteId ?? '', itemId),
  pricesTableSlug: (ref, itemId) => `commerce-le-supplier-item-${itemId}-site-${ref.siteId}-prices`,

  useSupplierRef: useSupplierSiteRef,
  useItemId: useSiteItemId,
  useExitPath: useSupplierExitPath,
  useSupplierAtSite,
  useEnroll: useEnrollSupplierSite,
  useUpdateEnrollment: useUpdateSupplierSiteEnrollment,
  useRemoveEnrollment: useRemoveSupplierSiteEnrollment,

  useSiteItemsTable: useSupplierSiteItemsTable,
  useSiteItem: useSupplierSiteItem,
  useUpdateItemTerms: useUpdateSupplierSiteItemTerms,

  useSitePricesTable: useSupplierSiteItemPricesTable,
  useSitePriceHistory: useSupplierSiteItemPriceHistory,
  useAddSitePrice: useAddSupplierSiteItemPrice,
  useUpdateSitePrice: useUpdateSupplierSiteItemPrice,
  useDeleteSitePrice: useDeleteSupplierSiteItemPrice,
};
