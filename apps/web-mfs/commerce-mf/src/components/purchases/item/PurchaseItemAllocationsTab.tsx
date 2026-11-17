import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { Typography } from '@vritti/quantum-ui/Typography';
import { ExternalLink, Pencil, Plus, Trash2, Truck } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PurchaseOrderStatusBadge } from '@/components/purchase-orders/PurchaseOrderStatusBadge';
import { purchaseOrderStatusConfig } from '@/schemas/purchase-orders';
import type { PurchaseDetail, PurchaseItemAllocationRow, PurchaseItemView } from '@/schemas/purchases';
import { workspaceBase } from '@/utils/workspace';
import type { PurchasesBinding } from '../bindings';
import { purchaseOrderPath } from '../documentPaths';
import { AddAllocationDialog } from '../forms/AddAllocationDialog';
import { EditAllocationDialog } from '../forms/EditAllocationDialog';
import { purchaseLegState } from '../purchaseState';

interface PurchaseItemAllocationsTabProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  item: PurchaseItemView;
  canAllocate: boolean;
  allocateTip: string;
}

const LOCKED_TIP = 'Locked — the supplier has left sourcing';

const PO_STATUS_OPTIONS = Object.entries(purchaseOrderStatusConfig).map(([value, { label }]) => ({ value, label }));

// The item's allocations a page at a time, allocated to another supplier from the toolbar while the purchase is open and
// the site has not blocked buying the item: the supplier and its leg's state, the ordering unit and quantity, the price
// and scheme, and the purchase order it became with what of it is received and invoiced; editable while its supplier is
// in sourcing, even once the site blocks buying the item, so its quantity can still come down
export const PurchaseItemAllocationsTab: React.FC<PurchaseItemAllocationsTabProps> = ({
  binding,
  purchase,
  item,
  canAllocate,
  allocateTip,
}) => {
  const { permissions } = binding;
  const fmt = useFormatters();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const allocationsQuery = binding.usePurchaseItemAllocationsTable(purchase.id, item.id);
  const removeMutation = binding.useRemoveAllocation();
  const allocateDialog = useDialog();
  const isFullyAllocated = item.allocatedPrimaryQty >= item.primaryQty;
  const unit = item.primaryUomSymbol;

  // Confirms and removes an allocation; the supplier's leg closes with its last one
  const handleRemove = useCallback(
    async (allocation: PurchaseItemAllocationRow) => {
      const confirmed = await confirm({
        title: `Remove ${allocation.supplierName}'s allocation?`,
        description: `${item.inventoryItemName} is no longer sourced from ${allocation.supplierName} for this allocation.`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeMutation.mutate({ id: purchase.id, allocationId: allocation.id });
    },
    [confirm, removeMutation, purchase.id, item.inventoryItemName],
  );

  const columns = useMemo<ColumnDef<PurchaseItemAllocationRow>[]>(
    () => [
      {
        accessorKey: 'supplierName',
        header: 'Supplier',
        meta: { grow: true },
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-1">
            <span>{row.original.supplierName}</span>
            <div className="flex items-center gap-1.5">
              <Badge variant={purchaseLegState({ step: row.original.legStep, status: row.original.legStatus }).variant}>
                {purchaseLegState({ step: row.original.legStep, status: row.original.legStatus }).label}
              </Badge>
              {row.original.quotationNumber && <Badge variant="outline">{row.original.quotationNumber}</Badge>}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'uomQty',
        header: 'Quantity',
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono">{`${fmt.number(row.original.uomQty).primary} ${row.original.uomSymbol}`}</span>
            <Typography variant="caption" intent="muted" className="font-mono">
              {`${fmt.number(row.original.primaryUomQty).primary} ${unit}`.trim()}
            </Typography>
          </div>
        ),
      },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }) =>
          row.original.isPriced ? (
            <span className="font-mono">{`${fmt.currency(row.original.unitPrice).primary} / ${row.original.uomSymbol}`}</span>
          ) : (
            <Typography variant="caption" intent="muted">
              Priced on the supplier invoice
            </Typography>
          ),
      },
      {
        accessorKey: 'hasScheme',
        header: 'Scheme',
        cell: ({ row }) =>
          row.original.hasScheme ? (
            <span className="font-mono">{`${fmt.number(row.original.schemeBuyQty).primary} + ${fmt.number(row.original.schemeFreeQty).primary}`}</span>
          ) : (
            <Typography variant="caption" intent="muted">
              —
            </Typography>
          ),
      },
      {
        accessorKey: 'poNumber',
        header: 'Purchase Order',
        cell: ({ row }) =>
          row.original.poNumber && row.original.poStatus ? (
            <div className="flex flex-col items-start gap-1">
              <StringCell value={row.original.poNumber} mono />
              <PurchaseOrderStatusBadge status={row.original.poStatus} />
            </div>
          ) : (
            <Typography variant="caption" intent="muted">
              Not ordered
            </Typography>
          ),
      },
      {
        accessorKey: 'receivedPrimaryQty',
        header: 'Received',
        cell: ({ row }) => <NumberCell value={row.original.receivedPrimaryQty} />,
      },
      {
        accessorKey: 'invoicedPrimaryQty',
        header: 'Invoiced',
        cell: ({ row }) => <NumberCell value={row.original.invoicedPrimaryQty} />,
      },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const allocation = row.original;
          const { purchaseOrderId, poNumber } = allocation;
          return (
            <RowActions
              actions={[
                {
                  id: 'open',
                  icon: ExternalLink,
                  label: 'Open Purchase Order',
                  hidden: purchaseOrderId === null || poNumber === null,
                  onClick: () =>
                    purchaseOrderId &&
                    poNumber &&
                    navigate(purchaseOrderPath(workspaceBase(pathname), { id: purchaseOrderId, poNumber })),
                },
                {
                  id: 'edit',
                  icon: Pencil,
                  label: 'Edit',
                  permission: permissions.edit,
                  disabled: !allocation.isEditable,
                  disabledTip: LOCKED_TIP,
                  dialog: {
                    title: 'Edit Allocation',
                    description: `Change what ${allocation.supplierName} supplies of ${item.inventoryItemName}.`,
                    className: 'max-w-2xl',
                    content: (close) => (
                      <EditAllocationDialog
                        binding={binding}
                        purchase={purchase}
                        item={item}
                        allocation={allocation}
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
                  disabled: !allocation.isEditable,
                  disabledTip: LOCKED_TIP,
                  onClick: () => handleRemove(allocation),
                },
              ]}
            />
          );
        },
      },
    ],
    [binding, purchase, item, unit, fmt, permissions.edit, handleRemove, navigate, pathname],
  );

  const allocationsTable = useDataTable({
    columns,
    slug: binding.purchaseItemTableSlug(purchase.id, item.id, 'allocations'),
    label: 'allocation',
    query: allocationsQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () =>
      queryClient.invalidateQueries({ queryKey: binding.purchaseItemTableKeys.allocations(purchase.id, item.id) }),
  });

  const allocateAction = (
    <Button
      size="sm"
      permission={permissions.edit}
      startAdornment={<Plus className="size-4" />}
      onClick={allocateDialog.open}
      disabled={!canAllocate || isFullyAllocated}
      disabledTip={canAllocate ? 'The whole quantity is allocated.' : allocateTip}
    >
      Allocate
    </Button>
  );

  return (
    <>
      <DataTable
        table={allocationsTable}
        mode="tab"
        permission={permissions.view}
        filters={[
          <binding.SupplierFilter key="supplierId" />,
          <SelectFilter key="poStatus" name="poStatus" label="PO Status" options={PO_STATUS_OPTIONS} />,
        ]}
        toolbarActions={{ actions: allocateAction }}
        emptyStateConfig={{
          icon: Truck,
          title: 'Not allocated',
          description: "Allocate the item to suppliers enrolled at the site, each in that supplier's unit.",
          action: allocateAction,
        }}
      />
      <Dialog
        handle={allocateDialog}
        className="max-w-2xl"
        icon={Plus}
        title="Allocate to Supplier"
        description={`Source part of ${item.inventoryItemName} from a supplier enrolled at the site.`}
        content={(close) => (
          <AddAllocationDialog binding={binding} purchase={purchase} item={item} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
