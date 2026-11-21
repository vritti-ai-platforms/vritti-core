import { useQueryClient } from '@tanstack/react-query';
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
import { useDialog } from '@vritti/quantum-ui/hooks';
import { SegmentedProgressKey } from '@vritti/quantum-ui/SegmentedProgress';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Eye, ListPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PurchaseActionValues,
  type PurchaseDetail,
  PurchaseItemProblemCodeValues,
  type PurchaseItemTableRow,
  purchaseStatusConfig,
} from '@/schemas/purchases';
import { CategoryFilter } from '@/selectors/category';
import { workspaceBase } from '@/utils/workspace';
import type { PurchasesBinding } from '../../bindings';
import { purchasePath } from '../../documentPaths';
import { AddAllocationDialog } from '../../forms/AddAllocationDialog';
import { AddPurchaseItemDialog } from '../../forms/AddPurchaseItemDialog';
import { EditPurchaseItemDialog } from '../../forms/EditPurchaseItemDialog';
import { PURCHASE_PROGRESS } from '../../purchaseState';
import { PurchaseItemProblems } from './PurchaseItemProblems';
import { PurchaseItemProgress } from './PurchaseItemProgress';
import { usePurchaseItemBucketOptions } from './usePurchaseItemBucketOptions';

interface PurchaseItemsTabProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
}

// The purchase's items a page at a time, narrowed to how far they have got: each with its progress, the suppliers it
// is allocated to and how many have quoted it; items are added, edited and allocated while the purchase is open
export const PurchaseItemsTab: React.FC<PurchaseItemsTabProps> = ({ binding, purchase }) => {
  const { permissions } = binding;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const addDialog = useDialog();
  const itemsQuery = binding.usePurchaseItemsTable(purchase.id);
  const removeMutation = binding.useRemoveItem();
  const { data: actions } = binding.usePurchaseActions(purchase.id);
  const availableActions = actions?.availableActions ?? [];
  const closedTip = `The purchase is ${purchaseStatusConfig[purchase.status].label.toLowerCase()}.`;
  const canEditItems = availableActions.includes(PurchaseActionValues.EDIT_ITEMS);
  const canAllocate = availableActions.includes(PurchaseActionValues.EDIT_ALLOCATIONS);

  const bucketOptions = usePurchaseItemBucketOptions(binding, purchase.id);
  const [bySupplier, setBySupplier] = useState(true);

  const columns = useMemo<ColumnDef<PurchaseItemTableRow>[]>(
    () => [
      {
        accessorKey: 'inventoryItemName',
        header: 'Item',
        enableSorting: true,
        size: 260,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="inline-flex items-center justify-center gap-1.5">
              {row.original.inventoryItemName}
              {row.original.problems.length > 0 && <PurchaseItemProblems problems={row.original.problems} />}
            </span>
            <StringCell value={row.original.inventoryItemCode} mono className="text-xs text-muted-foreground" />
            {purchase.quotationsRequired && (
              <Typography
                variant="caption"
                align="center"
                intent={row.original.quotingSupplierCount >= purchase.minQuotations ? 'muted' : 'warning'}
              >
                {`${row.original.quotingSupplierCount} of ${purchase.minQuotations} quoted`}
              </Typography>
            )}
          </div>
        ),
      },
      {
        id: 'progress',
        header: () => (
          <div className="flex flex-col items-center gap-1">
            <span>Progress</span>
            <SegmentedProgressKey
              items={PURCHASE_PROGRESS.segments}
              trackLabel={PURCHASE_PROGRESS.track.label}
              className="justify-center font-normal"
            />
          </div>
        ),
        size: 460,
        meta: { grow: true, label: 'Progress' },
        cell: ({ row }) => <PurchaseItemProgress item={row.original} bySupplier={bySupplier} />,
      },
      {
        accessorKey: 'neededBy',
        header: 'Needed By',
        enableSorting: true,
        cell: ({ row }) => <DateCell value={row.original.neededBy} />,
      },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const item = row.original;
          const isFullyAllocated = item.allocatedPrimaryQty >= item.primaryQty;
          const blocked = item.problems.find(
            (problem) => problem.code === PurchaseItemProblemCodeValues.PURCHASING_BLOCKED,
          );
          return (
            <RowActions
              actions={[
                {
                  id: 'view',
                  icon: Eye,
                  label: 'View',
                  permission: permissions.view,
                  onClick: () =>
                    navigate(
                      `${purchasePath(workspaceBase(pathname), purchase)}/items/${buildSlug(item.inventoryItemName, item.id)}`,
                    ),
                },
                {
                  id: 'allocate',
                  icon: Plus,
                  label: 'Allocate',
                  permission: permissions.edit,
                  disabled: !canAllocate || isFullyAllocated || blocked !== undefined,
                  disabledTip: !canAllocate ? closedTip : (blocked?.detail ?? 'The whole quantity is allocated.'),
                  dialog: {
                    title: 'Allocate to Supplier',
                    description: `Source part of ${item.inventoryItemName} from a supplier enrolled at the site.`,
                    className: 'max-w-2xl',
                    content: (close) => (
                      <AddAllocationDialog
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
                  id: 'edit',
                  icon: Pencil,
                  label: 'Edit',
                  permission: permissions.edit,
                  disabled: !canEditItems,
                  disabledTip: closedTip,
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
                  disabled: !canEditItems || item.allocatedPrimaryQty > 0,
                  disabledTip: canEditItems
                    ? 'Part of it is allocated; remove its allocations or cancel the supplier first.'
                    : closedTip,
                  confirm: {
                    title: `Remove "${item.inventoryItemName}"?`,
                    description: `${item.inventoryItemName} is removed from the purchase.`,
                    confirmLabel: 'Remove',
                    variant: 'destructive',
                  },
                  onClick: () => removeMutation.mutate({ id: purchase.id, itemId: item.id }),
                },
              ]}
            />
          );
        },
      },
    ],
    [
      binding,
      purchase,
      permissions,
      bySupplier,
      canAllocate,
      canEditItems,
      closedTip,
      navigate,
      pathname,
      removeMutation.mutate,
    ],
  );

  const itemsTable = useDataTable({
    columns,
    slug: binding.purchaseTableSlug(purchase.id, 'items'),
    label: 'item',
    query: itemsQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.purchaseTableKeys.items(purchase.id) }),
  });

  const addAction = (
    <Button
      size="sm"
      permission={permissions.edit}
      startAdornment={<Plus className="size-4" />}
      onClick={addDialog.open}
      disabled={!canEditItems}
      disabledTip={closedTip}
    >
      Add Item
    </Button>
  );

  return (
    <>
      <DataTable
        table={itemsTable}
        mode="tab"
        permission={permissions.view}
        contextBar={<SelectFilter key="bucket" name="bucket" label="Progress" options={bucketOptions} mode="context" />}
        searchConfig={{
          columns: [
            { id: 'inventoryItemName', label: 'Item' },
            { id: 'inventoryItemCode', label: 'Code' },
          ],
          searchAll: true,
        }}
        filters={[<CategoryFilter key="categoryId" />, <binding.SupplierFilter key="supplierId" />]}
        toolbarActions={{
          actions: (
            <div className="flex items-center gap-2">
              <StatusSwitch
                checked={bySupplier}
                onCheckedChange={setBySupplier}
                ariaLabel="Split progress by supplier"
                activeLabel="By Supplier"
                inactiveLabel="Combined"
                tone="info"
              />
              {addAction}
            </div>
          ),
        }}
        emptyStateConfig={{
          icon: ListPlus,
          title: 'No items',
          description: "Add what the site needs, in each item's primary unit, then allocate it to suppliers.",
          action: addAction,
        }}
      />
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
    </>
  );
};
