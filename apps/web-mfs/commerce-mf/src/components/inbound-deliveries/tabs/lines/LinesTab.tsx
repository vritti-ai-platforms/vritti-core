import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  NumberCell,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Boxes, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { InboundDeliveryData, InboundDeliveryLineData } from '@/schemas/inbound-deliveries';
import { workspaceBase } from '@/utils/workspace';
import type { InboundDeliveriesBinding, InboundDeliveryMutationsBinding } from '../../bindings';
import { AddInboundDeliveryLinesDialog } from './forms/AddInboundDeliveryLinesDialog';
import { UpdateInboundDeliveryLineDialog } from './forms/UpdateInboundDeliveryLineDialog';

const LOCKED_TIP = 'This delivery is received or cancelled, so its lines can no longer change.';

interface DeliveryLinesTableProps {
  binding: InboundDeliveriesBinding;
  delivery: InboundDeliveryData;
  rowActions?: (line: InboundDeliveryLineData) => RowAction[];
  toolbarAction?: React.ReactNode;
}

// The delivery's purchase order lines with how much of each comes on it and how much of that has been received
const DeliveryLinesTable: React.FC<DeliveryLinesTableProps> = ({ binding, delivery, rowActions, toolbarAction }) => {
  const deliveryId = delivery.id;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const linesTableQuery = binding.useLinesTable(deliveryId);

  const openPurchaseOrder = useCallback(
    (line: InboundDeliveryLineData) =>
      navigate(`${workspaceBase(pathname)}/purchase-orders/${buildSlug(line.poNumber, line.purchaseOrderId)}`),
    [navigate, pathname],
  );

  const columns = useMemo<ColumnDef<InboundDeliveryLineData>[]>(
    () => [
      {
        accessorKey: 'inventoryItemName',
        header: 'Inventory Item',
        cell: ({ row }) => <span className="font-medium">{row.original.inventoryItemName}</span>,
        enableSorting: true,
      },
      {
        accessorKey: 'poNumber',
        header: 'PO Number',
        cell: ({ row }) => (
          <Button
            variant="link"
            size="xs"
            className="h-auto p-0 font-mono"
            onClick={() => openPurchaseOrder(row.original)}
          >
            {row.original.poNumber}
          </Button>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'uomSymbol',
        header: 'UOM',
        cell: ({ row }) => <StringCell value={row.original.uomSymbol} />,
        enableSorting: false,
      },
      {
        accessorKey: 'orderedQty',
        header: 'Ordered',
        cell: ({ row }) => <NumberCell value={row.original.orderedQty} />,
        enableSorting: false,
      },
      {
        accessorKey: 'poReceivedQty',
        header: 'PO Received',
        cell: ({ row }) => <NumberCell value={row.original.poReceivedQty} />,
        enableSorting: false,
      },
      {
        accessorKey: 'quantity',
        header: 'On Delivery',
        cell: ({ row }) => <NumberCell value={row.original.quantity} />,
        enableSorting: true,
      },
      {
        accessorKey: 'receivedOnDeliveryQty',
        header: 'Received On Delivery',
        cell: ({ row }) => <NumberCell value={row.original.receivedOnDeliveryQty} />,
        enableSorting: false,
      },
      {
        accessorKey: 'openQty',
        header: 'Open',
        cell: ({ row }) => <NumberCell value={row.original.openQty} />,
        enableSorting: false,
      },
      ...(rowActions
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }) => <RowActions actions={rowActions(row.original)} />,
              enableSorting: false,
              enableHiding: false,
            } satisfies ColumnDef<InboundDeliveryLineData>,
          ]
        : []),
    ],
    [openPurchaseOrder, rowActions],
  );

  const linesTable = useDataTable({
    columns,
    query: linesTableQuery,
    slug: binding.linesTableSlug(deliveryId),
    label: 'line',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.linesTableKey(deliveryId) }),
  });

  return (
    <DataTable
      table={linesTable}
      mode="tab"
      permission={binding.viewPermission}
      searchConfig={{
        columns: [
          { id: 'inventoryItemName', label: 'Inventory Item' },
          { id: 'poNumber', label: 'PO Number' },
        ],
        searchAll: true,
      }}
      toolbarActions={toolbarAction ? { actions: toolbarAction } : undefined}
      emptyStateConfig={{
        icon: Boxes,
        title: 'No lines',
        description:
          toolbarAction && delivery.isEditable
            ? 'No purchase order lines on this delivery yet. Use "Add Lines" to get started.'
            : 'No purchase order lines on this delivery.',
        action: toolbarAction || undefined,
      }}
    />
  );
};

interface EditableLinesTabProps {
  binding: InboundDeliveriesBinding;
  mutations: InboundDeliveryMutationsBinding;
  delivery: InboundDeliveryData;
}

// The lines of a delivery the site enters: lines are added, their quantities changed and unreceived ones removed until
// the delivery is received or cancelled
const EditableLinesTab: React.FC<EditableLinesTabProps> = ({ binding, mutations, delivery }) => {
  const { permissions } = mutations;
  const confirm = useConfirm();
  const addLinesDialog = useDialog();
  const removeLineMutation = mutations.useRemoveLine();
  const isLocked = !delivery.isEditable;

  const handleRemove = useCallback(
    async (line: InboundDeliveryLineData) => {
      const confirmed = await confirm({
        title: `Remove "${line.inventoryItemName}"?`,
        description: `${line.inventoryItemName} of ${line.poNumber} will be taken off ${delivery.deliveryNumber}. The purchase order line stays open.`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeLineMutation.mutate({ id: delivery.id, lineId: line.id });
    },
    [confirm, delivery.id, delivery.deliveryNumber, removeLineMutation],
  );

  const rowActions = useCallback(
    (line: InboundDeliveryLineData): RowAction[] => [
      {
        id: 'edit',
        icon: Pencil,
        label: 'Edit Quantity',
        permission: permissions.edit,
        hidden: isLocked,
        dialog: {
          title: 'Edit Quantity',
          description: `How much of ${line.inventoryItemName} (${line.poNumber}) comes on this delivery.`,
          content: (close) => (
            <UpdateInboundDeliveryLineDialog mutations={mutations} line={line} onSuccess={close} onCancel={close} />
          ),
        },
      },
      {
        id: 'remove',
        icon: Trash2,
        label: 'Remove',
        variant: 'destructive',
        permission: permissions.edit,
        hidden: isLocked,
        disabled: line.receivedOnDeliveryQty > 0,
        disabledTip: 'Goods of this line have been received on this delivery, so it cannot be removed.',
        onClick: () => handleRemove(line),
      },
    ],
    [mutations, permissions.edit, isLocked, handleRemove],
  );

  const addLinesAction = (
    <Button
      size="sm"
      permission={permissions.edit}
      startAdornment={<Plus className="size-4" />}
      onClick={addLinesDialog.open}
      disabled={isLocked}
      disabledTip={LOCKED_TIP}
    >
      Add Lines
    </Button>
  );

  return (
    <>
      <DeliveryLinesTable
        binding={binding}
        delivery={delivery}
        rowActions={rowActions}
        toolbarAction={addLinesAction}
      />
      <Dialog
        handle={addLinesDialog}
        className="max-w-3xl"
        icon={Boxes}
        title="Add Lines"
        description={`Pick open lines of ${delivery.supplierName}'s purchase orders at this site and how much of each comes on this delivery.`}
        content={(close) => (
          <AddInboundDeliveryLinesDialog
            mutations={mutations}
            deliveryId={delivery.id}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};

interface LinesTabProps {
  binding: InboundDeliveriesBinding;
  delivery: InboundDeliveryData;
}

// The delivery's lines; editable where the binding enters deliveries, read-only elsewhere and on a delivery a goods
// receipt created, whose lines follow that receipt
export const LinesTab: React.FC<LinesTabProps> = ({ binding, delivery }) =>
  binding.mutations && delivery.source === 'ANNOUNCED' ? (
    <EditableLinesTab binding={binding} mutations={binding.mutations} delivery={delivery} />
  ) : (
    <DeliveryLinesTable binding={binding} delivery={delivery} />
  );
