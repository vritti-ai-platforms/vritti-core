import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { buildSlug } from '@vritti/quantum-ui/slug';
import type React from 'react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { SuppliersTab as SharedSuppliersTab } from '@/components/inventory-items/tabs/SuppliersTab';
import {
  LE_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY,
  useInventoryItemSuppliersTable,
} from '@/hooks/legal-entity/inventory-items';
import { workspaceBase } from '@/utils/workspace';

interface SuppliersTabProps {
  inventoryItemId: string;
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({ inventoryItemId }) => {
  const { pathname } = useLocation();
  // A supplier opens in the Suppliers feature of the same legal entity, on its Overview
  const supplierView = useMemo(
    () => ({
      path: (row: { supplierId: string; supplierName: string }) =>
        `${workspaceBase(pathname)}/suppliers/${buildSlug(row.supplierName, row.supplierId)}/overview`,
      permission: LE_SUPPLIERS.view,
    }),
    [pathname],
  );

  return (
    <SharedSuppliersTab
      inventoryItemId={inventoryItemId}
      useSuppliersTable={useInventoryItemSuppliersTable}
      tableKey={LE_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY(inventoryItemId)}
      tableSlug={`commerce-le-inventory-item-${inventoryItemId}-suppliers`}
      permission={LE_INVENTORY_ITEMS.view}
      supplierView={supplierView}
    />
  );
};
