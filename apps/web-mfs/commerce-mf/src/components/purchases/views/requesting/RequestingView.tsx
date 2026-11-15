import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { ListPlus, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  PurchaseActionValues,
  type PurchaseHeader,
  type PurchaseItem,
  PurchaseStatusValues,
  purchaseItemSourceConfig,
  purchaseStatusConfig,
  purchaseStepConfig,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';
import { AddPurchaseItemDialog } from './forms/AddPurchaseItemDialog';
import { EditPurchaseItemDialog } from './forms/EditPurchaseItemDialog';

interface RequestingViewProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  readOnly: boolean;
}

// The Requesting stage: the purchase's items — each in its primary unit — added, edited and submitted while it is
// requesting
export const RequestingView: React.FC<RequestingViewProps> = ({ binding, purchase, readOnly }) => {
  const { permissions } = binding;
  const fmt = useFormatters();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: items } = binding.usePurchaseItems(purchase.id);
  const removeMutation = binding.useRemoveItem();
  const canEditItems = !readOnly && purchase.availableActions.includes(PurchaseActionValues.EDIT_ITEMS);
  const closedTip = `The purchase is ${purchaseStatusConfig[purchase.status].label.toLowerCase()}.`;
  const submittedIn = purchaseStepConfig[purchase.step].label;

  // Confirms and removes an item from the purchase
  const handleRemove = useCallback(
    async (item: PurchaseItem) => {
      const confirmed = await confirm({
        title: `Remove "${item.inventoryItemName}"?`,
        description: `${item.inventoryItemName} is removed from the purchase.`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeMutation.mutate({ id: purchase.id, itemId: item.id });
    },
    [confirm, removeMutation, purchase.id],
  );

  const columns = useMemo<ColumnDef<PurchaseItem>[]>(
    () => [
      {
        accessorKey: 'inventoryItemName',
        header: 'Item',
        meta: { grow: true },
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.inventoryItemName}</span>
            <StringCell value={row.original.inventoryItemCode} mono className="text-xs text-muted-foreground" />
          </div>
        ),
      },
      {
        accessorKey: 'primaryQty',
        header: 'Quantity',
        cell: ({ row }) => (
          <span className="font-mono">
            {fmt.number(row.original.primaryQty).primary}{' '}
            <span className="text-muted-foreground">{row.original.primaryUomSymbol}</span>
          </span>
        ),
      },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }) => <Badge variant="outline">{purchaseItemSourceConfig[row.original.source].label}</Badge>,
      },
      {
        accessorKey: 'neededBy',
        header: 'Needed By',
        cell: ({ row }) => <DateCell value={row.original.neededBy} />,
      },
      { accessorKey: 'notes', header: 'Notes', cell: ({ row }) => <StringCell value={row.original.notes} /> },
      ...(canEditItems
        ? [
            {
              id: 'actions',
              header: '',
              enableHiding: false,
              cell: ({ row }) => {
                const item = row.original;
                return (
                  <RowActions
                    actions={[
                      {
                        id: 'edit',
                        icon: Pencil,
                        label: 'Edit',
                        permission: permissions.edit,
                        dialog: {
                          title: 'Edit Item',
                          description: `Change how much ${item.inventoryItemName} the purchase needs.`,
                          content: (close) => (
                            <EditPurchaseItemDialog
                              binding={binding}
                              purchase={purchase}
                              item={item}
                              onSuccess={close}
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
                        permission: permissions.edit,
                        onClick: () => handleRemove(item),
                      },
                    ]}
                  />
                );
              },
            } satisfies ColumnDef<PurchaseItem>,
          ]
        : []),
    ],
    [binding, purchase, permissions.edit, canEditItems, fmt, handleRemove],
  );

  const itemsTable = useDataTable({
    columns,
    query: { data: { result: items, count: items.length } },
    slug: 'commerce-purchase-items',
    label: 'item',
    enableRowSelection: false,
    enableSorting: false,
  });

  const addAction = (
    <Button
      size="sm"
      permission={permissions.edit}
      startAdornment={<Plus className="size-4" />}
      onClick={addDialog.open}
      disabled={!canEditItems}
      disabledTip={
        purchase.status === PurchaseStatusValues.OPEN
          ? `The items were submitted and the purchase is in ${submittedIn}; items can no longer be added.`
          : closedTip
      }
    >
      Add Item
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        table={itemsTable}
        mode="stepper"
        permission={permissions.view}
        toolbarActions={{
          actions: (
            <div className="flex items-center gap-2">
              {addAction}
              <SubmitItemsButton
                binding={binding}
                purchase={purchase}
                itemCount={items.length}
                canSubmit={canEditItems}
                lockedTip={
                  purchase.status === PurchaseStatusValues.OPEN
                    ? `The items were already submitted; the purchase is in ${submittedIn}.`
                    : closedTip
                }
              />
            </div>
          ),
        }}
        emptyStateConfig={{
          icon: ListPlus,
          title: 'No items yet',
          description: readOnly
            ? 'The purchase was closed before any item was added.'
            : "Add what the site needs, in each item's primary unit, then submit the items.",
          action: addAction,
        }}
      />
      {canEditItems && (
        <Dialog
          handle={addDialog}
          className="max-w-2xl"
          icon={ListPlus}
          title="Add Item"
          description="Add an item to the purchase."
          content={(close) => (
            <AddPurchaseItemDialog binding={binding} purchase={purchase} onSuccess={close} onCancel={close} />
          )}
        />
      )}
    </div>
  );
};

interface SubmitItemsButtonProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  itemCount: number;
  canSubmit: boolean;
  // Why the items can't be submitted any more, shown on the disabled button
  lockedTip: string;
}

// Submits the items once there are any, moving the purchase on to Quoting or straight to Sourcing
const SubmitItemsButton: React.FC<SubmitItemsButtonProps> = ({
  binding,
  purchase,
  itemCount,
  canSubmit,
  lockedTip,
}) => {
  const confirm = useConfirm();
  const submitMutation = binding.useSubmitItems();

  const nextStage = purchase.quotationsRequired ? 'Quoting' : 'Sourcing';
  // Confirms and submits the items; they are locked afterwards
  const handleSubmit = async () => {
    const confirmed = await confirm({
      title: 'Submit items?',
      description: `Submitting ${pluralize('item', itemCount, true)} moves the purchase on to ${nextStage}; its items can no longer be changed.`,
      confirmLabel: 'Submit Items',
    });
    if (confirmed) submitMutation.mutate(purchase.id);
  };

  return (
    <Button
      size="sm"
      permission={binding.permissions.edit}
      startAdornment={<Send className="size-4" />}
      onClick={handleSubmit}
      isLoading={submitMutation.isPending}
      disabled={!canSubmit || itemCount === 0}
      disabledTip={canSubmit ? 'Add an item before submitting the items.' : lockedTip}
    >
      Submit Items
    </Button>
  );
};
