import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { ListTree, Pencil, Plus, Trash2 } from 'lucide-react';
import type { PriceListData, PriceListItemData } from '@/schemas/price-lists';
import { getErrorMessage } from '@/utils/error';
import { EditPriceListItemDialog } from '../forms/EditPriceListItemDialog';
import { PriceListItemForm } from '../forms/PriceListItemForm';
import { usePriceListItemsState } from '../hooks/usePriceListItemsState';

interface PriceListItemsTabProps {
  priceList: PriceListData;
}

export const PriceListItemsTab = ({ priceList }: PriceListItemsTabProps) => {
  const confirm = useConfirm();
  const { orderedItems, assignedItemIds, isLoading, isSaving, error, saveOverride, removeItem } =
    usePriceListItemsState(priceList.id);

  const addDialog = useDialog();

  const handleRemove = async (item: PriceListItemData) => {
    const confirmed = await confirm({
      title: `Remove "${item.itemName}"?`,
      description: 'This item will no longer be available through this price list.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeItem(item);
  };

  const columns: ColumnDef<PriceListItemData>[] = [
    {
      accessorKey: 'itemName',
      header: 'Item',
      enableSorting: false,
      cell: ({ row }) => {
        const { itemName, itemVariantName } = row.original;
        const showVariant = itemVariantName && itemVariantName !== itemName;
        return (
          <span className="font-medium">
            {itemName}
            {showVariant && <span className="text-muted-foreground font-normal"> · {itemVariantName}</span>}
          </span>
        );
      },
    },
    {
      id: 'price',
      header: 'Price',
      enableSorting: false,
      cell: ({ row }) => <PriceCell item={row.original} />,
    },
    {
      accessorKey: 'isVisible',
      header: 'Visible',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.isVisible ? (
          <Badge variant="secondary" className="bg-success/15 text-success">
            Visible
          </Badge>
        ) : (
          <Badge variant="outline">Hidden</Badge>
        ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              id: 'edit',
              icon: Pencil,
              label: 'Edit',
              disabled: isSaving,
              dialog: {
                title: 'Edit Item',
                description: `Adjust price override and visibility for "${row.original.itemName}".`,
                className: 'max-w-sm',
                content: (close) => (
                  <EditPriceListItemDialog
                    item={row.original}
                    isSaving={isSaving}
                    onSave={(item, priceOverride, isVisible) => {
                      saveOverride(item, priceOverride, isVisible);
                      close();
                    }}
                    onCancel={close}
                  />
                ),
              },
            },
            {
              id: 'remove',
              icon: Trash2,
              label: 'Remove',
              variant: 'destructive',
              disabled: isSaving,
              onClick: () => handleRemove(row.original),
            },
          ]}
        />
      ),
    },
  ];

  const { table } = useDataTable({
    columns,
    slug: `commerce-price-list-items-${priceList.id}`,
    label: 'item',
    serverState: { result: orderedItems, count: orderedItems.length },
    enableRowSelection: false,
    enableSorting: false,
    enableMultiSort: false,
  });

  const addButton = (
    <Button size="sm" onClick={addDialog.open} disabled={isSaving} startAdornment={<Plus className="size-4" />}>
      Add Items
    </Button>
  );

  return (
    <div className="space-y-4">
      {error ? <Alert variant="destructive" title="Failed to load" description={getErrorMessage(error)} /> : null}

      <DataTable
        table={table}
        mode="compact"
        isLoading={isLoading}
        searchConfig={{
          columns: [
            { id: 'itemName', label: 'Item' },
            { id: 'itemVariantSku', label: 'SKU' },
          ],
          searchAll: true,
        }}
        toolbarActions={{ actions: addButton }}
        emptyStateConfig={{
          icon: ListTree,
          title: 'No items',
          description: 'Add items to this price list to control what the terminal can sell.',
          action: addButton,
        }}
      />

      <Dialog
        handle={addDialog}
        title="Add Items"
        description="Select items to include in this price list."
        className="max-w-lg"
        content={(close) => (
          <PriceListItemForm
            priceListId={priceList.id}
            excludeItemIds={assignedItemIds}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

    </div>
  );
};

const PriceCell = ({ item }: { item: PriceListItemData }) => {
  const hasOverride = item.priceOverride != null;
  const baseLabel = item.basePrice?.toLocaleString() ?? '—';

  if (!hasOverride) {
    return <span className="text-sm text-muted-foreground">{baseLabel}</span>;
  }

  return (
    <span className="text-sm">
      <span className="font-medium">{item.priceOverride!.toLocaleString()}</span>
      <span className="ml-1.5 text-xs text-muted-foreground line-through">{baseLabel}</span>
    </span>
  );
};
