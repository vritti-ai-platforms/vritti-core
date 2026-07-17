import { ORG_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Package, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteInventoryItem, useInventoryItem } from '@/hooks/organization/inventory-items';
import { EditInventoryItemForm } from './forms/EditInventoryItemForm';
import { MrpTab } from './tabs/MrpTab';
import { OverviewTab } from './tabs/OverviewTab';
import { SuppliersTab } from './tabs/SuppliersTab';
import { UomConversionsTab } from './tabs/UomConversionsTab';

export const InventoryItemDetailPage = () => {
  const { id } = useSlugParams('itemSlug');
  const navigate = useNavigate();
  const { data: item } = useInventoryItem(id);
  const [activeTab, setActiveTab] = useState('overview');
  const editDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeleteInventoryItem();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete "${item.name}"?`,
      description: 'This inventory item and its UOM conversions and MRP will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(item.id, { onSuccess: () => navigate('..') });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.name}
        description={item.description ?? 'No description'}
        actions={
          <Button
            variant="outline"
            size="sm"
            startAdornment={<Pencil className="size-4" />}
            onClick={editDialog.open}
            permission={ORG_INVENTORY_ITEMS.edit}
          >
            Edit
          </Button>
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: ORG_INVENTORY_ITEMS.view,
            content: <OverviewTab item={item} />,
          },
          {
            value: 'uom-conversions',
            label: 'UOM Conversions',
            permission: ORG_INVENTORY_ITEMS.conversions.view,
            content: (
              <UomConversionsTab
                inventoryItemId={item.id}
                itemUomId={item.uomId}
                itemUomSymbol={item.uomSymbol ?? ''}
              />
            ),
          },
          {
            value: 'mrp',
            label: 'MRP',
            permission: ORG_INVENTORY_ITEMS.mrp.view,
            content: <MrpTab inventoryItemId={item.id} />,
          },
          {
            value: 'suppliers',
            label: 'Suppliers',
            permission: ORG_INVENTORY_ITEMS.view,
            content: <SuppliersTab inventoryItemId={item.id} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <DangerZone
        title="Delete this inventory item"
        description="This action cannot be undone. All UOM conversions and MRP will be permanently removed."
        buttonText="Delete Item"
        permission={ORG_INVENTORY_ITEMS.delete}
        onClick={handleDelete}
        disabled={!item.canDelete}
        warning="This item is referenced by suppliers, catalogs, or purchase orders and cannot be deleted."
        showWarning={!item.canDelete}
      />

      <Dialog
        handle={editDialog}
        icon={Package}
        title="Edit Inventory Item"
        description="Update the details for this inventory item."
        className="max-w-4xl"
        content={(close) => <EditInventoryItemForm item={item} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
