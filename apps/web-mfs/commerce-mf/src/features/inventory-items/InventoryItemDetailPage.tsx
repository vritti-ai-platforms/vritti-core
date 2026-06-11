import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Package, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteInventoryItem, useInventoryItem } from '@/hooks/inventory-items';
import { EditInventoryItemForm } from './forms/EditInventoryItemForm';
import { LedgerTab } from './tabs/LedgerTab';
import { LocationsTab } from './tabs/LocationsTab';
import { LotsTab } from './tabs/LotsTab';
import { OverviewTab } from './tabs/OverviewTab';
import { QuantsTab } from './tabs/QuantsTab';
import { StockLevelsTab } from './tabs/StockLevelsTab';
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
      description: 'This inventory item and all its quants and ledger entries will be permanently removed.',
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
          <Button variant="outline" size="sm" startAdornment={<Pencil className="size-4" />} onClick={editDialog.open}>
            Edit
          </Button>
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: <OverviewTab item={item} />,
          },
          {
            value: 'locations',
            label: 'Locations',
            content: <LocationsTab inventoryItemId={item.id} uomSymbol={item.uomSymbol} />,
          },
          {
            value: 'stock-levels',
            label: 'Stock Levels',
            content: <StockLevelsTab inventoryItemId={item.id} uomSymbol={item.uomSymbol} />,
          },
          {
            value: 'uom-conversions',
            label: 'UOM Conversions',
            content: (
              <UomConversionsTab
                inventoryItemId={item.id}
                itemUomId={item.uomId}
                itemUomSymbol={item.uomSymbol ?? ''}
              />
            ),
          },
          {
            value: 'suppliers',
            label: 'Suppliers',
            content: <SuppliersTab inventoryItemId={item.id} />,
          },
          ...(item.tracking === 'lot' || item.tracking === 'lot_serial'
            ? [
                {
                  value: 'lots',
                  label: 'Lots',
                  content: <LotsTab inventoryItemId={item.id} uomSymbol={item.uomSymbol} />,
                },
              ]
            : []),
          {
            value: 'quants',
            label: 'Quants',
            content: <QuantsTab inventoryItemId={item.id} uomSymbol={item.uomSymbol} />,
          },
          {
            value: 'ledger',
            label: 'Ledger',
            content: <LedgerTab inventoryItemId={item.id} uomSymbol={item.uomSymbol} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <DangerZone
        title="Delete this inventory item"
        description="This action cannot be undone. All quants and ledger entries will be permanently removed."
        buttonText="Delete Item"
        onClick={handleDelete}
        disabled={!item.canDelete}
        warning={
          !item.canDelete
            ? 'This item is referenced by stock adjustments, transfers, or purchase orders and cannot be deleted.'
            : undefined
        }
      />

      <Dialog
        handle={editDialog}
        icon={Package}
        title="Edit Inventory Item"
        description="Update the details for this inventory item."
        content={(close) => <EditInventoryItemForm item={item} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
