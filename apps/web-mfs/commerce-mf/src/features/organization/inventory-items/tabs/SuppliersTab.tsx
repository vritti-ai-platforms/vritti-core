import { ORG_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import type React from 'react';
import { SuppliersTab as SharedSuppliersTab } from '@/components/inventory-items/tabs/SuppliersTab';
import {
  ORG_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY,
  useInventoryItemSuppliersTable,
} from '@/hooks/organization/inventory-items';

interface SuppliersTabProps {
  inventoryItemId: string;
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({ inventoryItemId }) => (
  <SharedSuppliersTab
    inventoryItemId={inventoryItemId}
    useSuppliersTable={useInventoryItemSuppliersTable}
    tableKey={ORG_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY(inventoryItemId)}
    tableSlug={`org-inventory-item-${inventoryItemId}-suppliers`}
    permission={ORG_INVENTORY_ITEMS.view}
  />
);
