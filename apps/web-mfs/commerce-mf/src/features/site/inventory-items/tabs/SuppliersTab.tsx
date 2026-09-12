import type React from 'react';
import { SuppliersTab as SharedSuppliersTab } from '@/components/inventory-items/tabs/SuppliersTab';
import { INVENTORY_ITEM_SUPPLIERS_TABLE_KEY, useInventoryItemSuppliersTable } from '@/hooks/site/inventory-items';

interface SuppliersTabProps {
  inventoryItemId: string;
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({ inventoryItemId }) => (
  <SharedSuppliersTab
    inventoryItemId={inventoryItemId}
    useSuppliersTable={useInventoryItemSuppliersTable}
    tableKey={INVENTORY_ITEM_SUPPLIERS_TABLE_KEY(inventoryItemId)}
    tableSlug={`commerce-site-inventory-item-${inventoryItemId}-suppliers`}
  />
);
