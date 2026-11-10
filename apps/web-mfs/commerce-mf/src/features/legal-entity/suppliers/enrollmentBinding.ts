import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { filter } from '@vritti/quantum-ui/filter';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { useParams } from 'react-router-dom';
import type { SupplierEnrollmentBinding } from '@/components/suppliers/bindings';
import {
  SUPPLIER_ENROLLMENT_SITE_ITEMS_TABLE_KEY,
  SUPPLIER_ENROLLMENTS_TABLE_KEY,
  useCreateSupplierEnrollment,
  useDeleteSupplierEnrollment,
  useSetSupplierEnrollmentActive,
  useSupplierEnrollment,
  useSupplierEnrollmentRef,
  useSupplierEnrollmentSiteItemsTable,
  useSupplierEnrollmentsTable,
  useUpdateSupplierEnrollment,
} from '@/hooks/legal-entity/supplier-enrollments';
import { useSupplierLookup, useUpdateSupplierSiteItem } from '@/hooks/legal-entity/suppliers';
import type { SupplierEnrollmentKey, SupplierParty } from '@/schemas/supplier-enrollments';
import { pricesBinding } from './pricesBinding';
import { quotationsBinding } from './quotationsBinding';

// Back to the Enrollments tab of the supplier the enrollment page was opened from
function useSupplierExitPath(): string {
  const { supplierSlug } = useParams();
  return `../${supplierSlug}/enrollments`;
}

// The supplier of the LE supplier page the Enrollments tab sits on
function useSupplierScope(): Partial<SupplierEnrollmentKey> {
  return { supplierId: useSlugParams('supplierSlug').id };
}

function useEnrollmentsTable(scope: Partial<SupplierEnrollmentKey>) {
  return useSupplierEnrollmentsTable(scope.supplierId);
}

// The supplier's detail carries its party, tax ID and default payment term
function useSupplierParty(supplierId: string | undefined): SupplierParty | undefined {
  return useSupplierLookup(supplierId).data;
}

export const enrollmentBinding: SupplierEnrollmentBinding = {
  permissions: {
    view: LE_SUPPLIERS.sites.view,
    enroll: LE_SUPPLIERS.sites.enroll,
    editEnroll: LE_SUPPLIERS.sites.editEnroll,
    unenroll: LE_SUPPLIERS.sites.unenroll,
    siteItems: { view: LE_SUPPLIERS.siteItems.view, edit: LE_SUPPLIERS.siteItems.edit },
  },
  table: {
    rows: 'sites',
    useScope: useSupplierScope,
    useTable: useEnrollmentsTable,
    queryKey: (scope) => SUPPLIER_ENROLLMENTS_TABLE_KEY(scope.supplierId ?? ''),
    slug: (scope) => `commerce-le-supplier-${scope.supplierId}-enrollments`,
    // The tab route is `<supplier>/enrollments`, so a row's page is one segment deeper
    rowPath: (row) => buildSlug(row.siteName ?? row.siteCode ?? row.siteId, row.siteId),
  },
  quotations: quotationsBinding,
  siteItemsTableKey: (ref) => SUPPLIER_ENROLLMENT_SITE_ITEMS_TABLE_KEY(ref.supplierId, ref.siteId ?? ''),
  siteItemsTableSlug: (ref) => `commerce-le-supplier-${ref.supplierId}-site-${ref.siteId}-site-items`,

  useEnrollmentRef: useSupplierEnrollmentRef,
  useExitPath: useSupplierExitPath,
  useEnrollment: useSupplierEnrollment,
  useSupplierParty,
  useCreateEnrollment: useCreateSupplierEnrollment,
  useUpdateEnrollment: useUpdateSupplierEnrollment,
  useSetEnrollmentActive: useSetSupplierEnrollmentActive,
  useDeleteEnrollment: useDeleteSupplierEnrollment,

  useSiteItemsTable: useSupplierEnrollmentSiteItemsTable,
  useUpdateSiteItem: useUpdateSupplierSiteItem,
  // The supplier item page's Prices tab with the enrollment's site picked — LE keeps an item's site data there
  siteItemPath: (itemSlug) => `../../items/${itemSlug}/prices`,
  siteItemTableContext: (itemId, ref) => ({
    tableSlug: pricesBinding.tableSlug(ref.supplierId, itemId),
    queryKey: pricesBinding.tableKey(ref.supplierId, itemId),
    context: ref.siteId ? [filter('site').equals(ref.siteId)] : [],
  }),
};
