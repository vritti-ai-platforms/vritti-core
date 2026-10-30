import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { buildSlug } from '@vritti/quantum-ui/slug';
import type React from 'react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { SuppliersTab as SharedSuppliersTab } from '@/components/inventory-items/tabs/SuppliersTab';
import { INVENTORY_ITEM_SUPPLIERS_TABLE_KEY, useInventoryItemSuppliersTable } from '@/hooks/site/inventory-items';
import { workspaceBase } from '@/utils/workspace';

interface SuppliersTabProps {
  inventoryItemId: string;
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({ inventoryItemId }) => {
  const { pathname } = useLocation();
  // A supplier opens in the site's Suppliers feature
  const supplierView = useMemo(
    () => ({
      path: (row: { supplierId: string; supplierName: string }) =>
        `${workspaceBase(pathname)}/suppliers/${buildSlug(row.supplierName, row.supplierId)}`,
      permission: SITE_SUPPLIERS.view,
    }),
    [pathname],
  );

  return (
    <SharedSuppliersTab
      inventoryItemId={inventoryItemId}
      useSuppliersTable={useInventoryItemSuppliersTable}
      tableKey={INVENTORY_ITEM_SUPPLIERS_TABLE_KEY(inventoryItemId)}
      tableSlug={`commerce-site-inventory-item-${inventoryItemId}-suppliers`}
      showSiteTerms
      supplierView={supplierView}
    />
  );
};
