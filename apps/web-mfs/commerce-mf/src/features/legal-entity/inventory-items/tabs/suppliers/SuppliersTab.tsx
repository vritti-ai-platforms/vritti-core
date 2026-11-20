import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Truck } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { SuppliersTab as SharedSuppliersTab } from '@/components/inventory-items/tabs/SuppliersTab';
import {
  LE_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY,
  useInventoryItemSuppliersTable,
} from '@/hooks/legal-entity/inventory-items';
import { workspaceBase } from '@/utils/workspace';
import { AddInventoryItemSupplierForm } from './forms/AddInventoryItemSupplierForm';

interface SuppliersTabProps {
  inventoryItemId: string;
  itemName: string;
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({ inventoryItemId, itemName }) => {
  const { pathname } = useLocation();
  const addDialog = useDialog();
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
    <>
      <SharedSuppliersTab
        inventoryItemId={inventoryItemId}
        useSuppliersTable={useInventoryItemSuppliersTable}
        tableKey={LE_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY(inventoryItemId)}
        tableSlug={`commerce-le-inventory-item-${inventoryItemId}-suppliers`}
        permission={LE_INVENTORY_ITEMS.suppliers.view}
        siteContext
        supplierView={supplierView}
        addAction={
          <Button
            size="sm"
            startAdornment={<Truck className="size-4" />}
            onClick={addDialog.open}
            permission={LE_INVENTORY_ITEMS.suppliers.add}
          >
            Add Supplier
          </Button>
        }
      />

      <Dialog
        handle={addDialog}
        icon={Truck}
        title="Add Supplier"
        className="max-w-2xl"
        description={`Set ${itemName} up as one of a supplier's items, in the unit they sell it in and at the sites that buy it from them.`}
        content={(close) => (
          <AddInventoryItemSupplierForm inventoryItemId={inventoryItemId} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
