import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryItemsTable } from '@/components/inventory-items/InventoryItemsTable';
import { LE_INVENTORY_ITEMS_TABLE_KEY, useInventoryItemsTable } from '@/hooks/legal-entity/inventory-items';
import type { InventoryItemData } from '@/schemas/inventory-items';

export const InventoryItemsPage = () => {
  const navigate = useNavigate();
  const { data: response, isLoading } = useInventoryItemsTable();
  const rowActions = useCallback(
    (row: InventoryItemData) => [
      {
        id: 'view',
        icon: Eye,
        label: 'View',
        permission: LE_INVENTORY_ITEMS.view,
        onClick: () => navigate(`${buildSlug(row.name, row.id)}/overview`),
      },
    ],
    [navigate],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inventory Items" description="The organization's materials and products" />

      <InventoryItemsTable
        response={response}
        isLoading={isLoading}
        slug="commerce-le-inventory-items"
        tableKey={LE_INVENTORY_ITEMS_TABLE_KEY}
        permission={LE_INVENTORY_ITEMS.view}
        rowActions={rowActions}
      />
    </div>
  );
};
