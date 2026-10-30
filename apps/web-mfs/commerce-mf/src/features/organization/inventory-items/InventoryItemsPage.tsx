import { ORG_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Package, Plus } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryItemsTable } from '@/components/inventory-items/InventoryItemsTable';
import { ORG_INVENTORY_ITEMS_TABLE_KEY, useInventoryItemsTable } from '@/hooks/organization/inventory-items';
import type { InventoryItemData } from '@/schemas/inventory-items';
import { AddInventoryItemDialog } from './forms/AddInventoryItemDialog';

export const InventoryItemsPage = () => {
  const navigate = useNavigate();
  const { data: response, isLoading } = useInventoryItemsTable();
  const addDialog = useDialog();

  const rowActions = useCallback(
    (item: InventoryItemData) => [
      { id: 'view', icon: Eye, label: 'View', onClick: () => navigate(buildSlug(item.name, item.id)) },
    ],
    [navigate],
  );

  const addButton = (
    <Button size="sm" onClick={addDialog.open} permission={ORG_INVENTORY_ITEMS.add}>
      <Plus className="mr-2 size-4" />
      Add Item
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inventory Items" description="Define materials and products for the organization" />

      <InventoryItemsTable
        response={response}
        isLoading={isLoading}
        slug="commerce-org-inventory-items"
        tableKey={ORG_INVENTORY_ITEMS_TABLE_KEY}
        permission={ORG_INVENTORY_ITEMS.view}
        rowActions={rowActions}
        toolbarActions={addButton}
        emptyStateConfig={{
          icon: Package,
          title: 'No inventory items',
          description: 'Define your first inventory item for the organization.',
          action: addButton,
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Package}
        title="Add Inventory Item"
        className="max-w-4xl"
        description="Define a new material or product for the organization."
        content={(close) => <AddInventoryItemDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
