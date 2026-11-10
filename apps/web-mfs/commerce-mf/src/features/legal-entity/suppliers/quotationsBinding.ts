import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { SupplierQuotationsBinding } from '@/components/suppliers/bindings';
import type { QuotationPath, QuotationRef } from '@/components/suppliers/types';
import {
  SUPPLIER_ENROLLMENT_QUOTATIONS_TABLE_KEY,
  SUPPLIER_QUOTATION_KEY,
  SUPPLIER_QUOTATIONS_TABLE_KEY,
  useSupplierEnrollmentQuotationsTable,
  useSupplierQuotation,
  useSupplierQuotationsTable,
} from '@/hooks/legal-entity/supplier-quotations';
import { useSupplier } from '@/hooks/legal-entity/suppliers';
import { QuotationDeleteZone } from './tabs/quotations/QuotationDeleteZone';
import { QuotationHeaderActions } from './tabs/quotations/QuotationHeaderActions';
import { QuotationListAction } from './tabs/quotations/QuotationListAction';
import { ItemsTab } from './tabs/quotations/tabs/items/ItemsTab';
import { SitesTab } from './tabs/quotations/tabs/sites/SitesTab';

// A supplier's quotations, or those posted to the enrollment's site
function useQuotationsTable(supplierId: string, siteId: string | undefined) {
  const supplierTable = useSupplierQuotationsTable(supplierId, { enabled: !siteId });
  const siteTable = useSupplierEnrollmentQuotationsTable(supplierId, siteId);
  return siteId ? siteTable : supplierTable;
}

// A quotation sits under the supplier's Quotations tab; its number names the crumb
function useQuotationPath(siteId: string | undefined): QuotationPath {
  const { tab } = useParams();
  return useCallback(
    (quotation) => {
      const slug = buildSlug(quotation.quotationNumber, quotation.id);
      if (siteId) return `../../quotations/${slug}`;
      return tab === 'quotations' ? slug : `quotations/${slug}`;
    },
    [tab, siteId],
  );
}

// The quotation route is `…/<supplier>/quotations/<number~id>`
function useQuotationRef(): QuotationRef {
  return { supplierId: useSlugParams('supplierSlug').id, quotationId: useSlugParams('quotationId').id };
}

function useSupplierName(supplierId: string): string {
  return useSupplier(supplierId).data.partyName;
}

export const quotationsBinding: SupplierQuotationsBinding = {
  permissions: {
    view: LE_SUPPLIERS.quotations.view,
    siteView: LE_SUPPLIERS.sites.quotations.view,
    mrpView: LE_INVENTORY_ITEMS.mrp.view,
  },
  useTable: useQuotationsTable,
  tableKey: (supplierId, siteId) =>
    siteId ? SUPPLIER_ENROLLMENT_QUOTATIONS_TABLE_KEY(supplierId, siteId) : SUPPLIER_QUOTATIONS_TABLE_KEY(supplierId),
  tableSlug: (supplierId, siteId) =>
    siteId
      ? `commerce-le-supplier-${supplierId}-site-${siteId}-quotations`
      : `commerce-le-supplier-${supplierId}-quotations`,
  useQuotationPath,
  emptyState: (siteId) =>
    siteId
      ? {
          title: 'No quotations at this site',
          description: "Post one of the supplier's quotations to this site from the quotation's Sites tab.",
        }
      : {
          title: 'No quotations',
          description: "Record the supplier's quotation, add its lines, then post it to the sites it applies to.",
        },
  useQuotationRef,
  useQuotation: useSupplierQuotation,
  quotationKey: SUPPLIER_QUOTATION_KEY,
  useSupplierName,
  authoring: {
    ListAction: QuotationListAction,
    HeaderActions: QuotationHeaderActions,
    LinesTab: ItemsTab,
    SitesTab,
    DeleteZone: QuotationDeleteZone,
  },
};
