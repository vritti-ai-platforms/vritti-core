import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import type { DisplayQuantity } from '@vritti/quantum-ui/format';
import { useConfirm, useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import { Boxes, ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { purchaseLockTip } from '@/components/purchases/purchaseDocuments';
import {
  type PurchaseOrderDetail,
  type PurchaseOrderItemData,
  type PurchaseOrderProblem,
  type PurchaseOrderStatus,
  purchaseOrderStatusConfig,
} from '@/schemas/purchase-orders';
import { workspaceBase } from '@/utils/workspace';
import type { PurchaseOrdersBinding } from '../../bindings';
import { ExpectedDeliveryCell } from '../../ExpectedDeliveryCell';
import { TaxDateCell } from '../../TaxDateCell';
import { AddPurchaseOrderItemDialog } from './forms/AddPurchaseOrderItemDialog';
import { UpdatePurchaseOrderItemDialog } from './forms/UpdatePurchaseOrderItemDialog';
import { LineProblemsMenu } from './problems/LineProblemsMenu';

const LINE_EDITABLE_STATUSES: PurchaseOrderStatus[] = ['DRAFT', 'SENT', 'CONFIRMED'];
const PRICING_LOCKED_TIP = 'A goods receipt of this order is posted, so its supplier, prices and rates are locked.';

// Explains why the order's lines can no longer change, or nothing while they still can
function linesLockedReason(purchaseOrder: PurchaseOrderDetail): string | undefined {
  if (purchaseOrder.purchaseNumber) return purchaseLockTip(purchaseOrder.purchaseNumber);
  if (purchaseOrder.hasPostedGoodsReceipt) return PRICING_LOCKED_TIP;
  if (LINE_EDITABLE_STATUSES.includes(purchaseOrder.status)) return undefined;
  const statusLabel = purchaseOrderStatusConfig[purchaseOrder.status].label.toLowerCase();
  return `This order is ${statusLabel}, so its lines can no longer change.`;
}

// A counter kept in the item's primary unit, shown in the item's display unit
const PrimaryQuantityCell = ({ qty }: { qty: DisplayQuantity | null }) => {
  const fmt = useFormatters();
  return <span className="font-mono">{fmt.quantity(qty).primary}</span>;
};

// A line quantity in its own unit; a line ordered in a pack unit adds the item's quantity in its display unit under it
const LineQuantityCell = ({
  line,
  qty,
  primaryQty,
}: {
  line: PurchaseOrderItemData;
  qty: number;
  primaryQty: DisplayQuantity | null;
}) => {
  const fmt = useFormatters();
  return (
    <span className="flex flex-col">
      <NumberCell value={qty} />
      {line.primaryUomQty !== line.uomQty && (
        <span className="font-mono text-xs text-muted-foreground">{fmt.quantity(primaryQty).primary}</span>
      )}
    </span>
  );
};

interface LineItemsTabProps {
  binding: PurchaseOrdersBinding;
  purchaseOrder: PurchaseOrderDetail;
}

// The order's lines with the free quantity their scheme gives, what is received and still to receive, what is invoiced
// and still to invoice (SAP's PO history), a line marked delivery completed, and what its receipts flagged and its
// invoices hold on them; lines are edited until the order is past confirmation or a receipt of it is posted
export const LineItemsTab: React.FC<LineItemsTabProps> = ({ binding, purchaseOrder }) => {
  const { permissions, invoices } = binding;
  const purchaseOrderId = purchaseOrder.id;
  const lockedReason = linesLockedReason(purchaseOrder);
  const areLinesLocked = lockedReason !== undefined;

  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addItemDialog = useDialog();
  const fmt = useFormatters();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const itemsTableQuery = binding.useItemsTable(purchaseOrderId);
  const { data: problems } = binding.useProblems(purchaseOrderId);
  const removeItemMutation = binding.useRemoveItem();

  const problemsByLine = useMemo(
    () => new Map(problems?.lines.map((line) => [line.purchaseOrderItemId, line.problems])),
    [problems],
  );

  // Opens a receipt in the goods receipts feature and an invoice on its own page, which invoices the order's supplier
  const openProblemDocument = useCallback(
    (problem: PurchaseOrderProblem) => {
      if (problem.source === 'GOODS_RECEIPT') {
        navigate(`${workspaceBase(pathname)}/goods-receipts/${buildSlug(problem.documentNumber, problem.documentId)}`);
      } else if (invoices) {
        const invoice = {
          id: problem.documentId,
          invoiceNumber: problem.documentNumber,
          supplierId: purchaseOrder.supplierId,
          supplierName: purchaseOrder.supplierName,
        };
        navigate(invoices.invoicePath(invoice), { relative: 'path' });
      }
    },
    [navigate, pathname, invoices, purchaseOrder.supplierId, purchaseOrder.supplierName],
  );

  const handleRemoveItem = useCallback(
    async (item: PurchaseOrderItemData) => {
      const confirmed = await confirm({
        title: `Remove "${item.inventoryItemName}"?`,
        description: `${item.inventoryItemName} will be removed from ${purchaseOrder.poNumber}.`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeItemMutation.mutate({ id: purchaseOrderId, itemId: item.id });
    },
    [confirm, purchaseOrderId, purchaseOrder.poNumber, removeItemMutation],
  );

  const columns = useMemo<ColumnDef<PurchaseOrderItemData>[]>(
    () => [
      {
        accessorKey: 'inventoryItemName',
        header: 'Inventory Item',
        size: 220,
        meta: { grow: true },
        cell: ({ row }) => {
          const lineProblems = problemsByLine.get(row.original.id);
          return (
            <span className="inline-flex items-center gap-1.5">
              <span>{row.original.inventoryItemName}</span>
              {row.original.cancelledPrimaryQty > 0 && <Badge variant="secondary">Delivery completed</Badge>}
              {row.original.purchasingBlockedReason !== null && (
                <Tooltip
                  content={`Purchasing is blocked at this site: ${row.original.purchasingBlockedReason}. The line can be lowered but not raised.`}
                >
                  <Badge variant="destructive">Purchasing blocked</Badge>
                </Tooltip>
              )}
              {lineProblems && (
                <LineProblemsMenu
                  itemName={row.original.inventoryItemName}
                  problems={lineProblems}
                  onOpen={openProblemDocument}
                />
              )}
            </span>
          );
        },
      },
      {
        id: 'quantity',
        header: 'Quantity',
        columns: [
          {
            accessorKey: 'orderUomSymbol',
            header: 'Unit',
            size: 90,
            cell: ({ row }) => <StringCell value={row.original.orderUomSymbol} mono />,
            enableSorting: false,
          },
          {
            accessorKey: 'uomQty',
            header: 'Ordered',
            size: 96,
            cell: ({ row }) => (
              <LineQuantityCell
                line={row.original}
                qty={row.original.uomQty}
                primaryQty={row.original.display.primaryUomQty}
              />
            ),
          },
          {
            accessorKey: 'expectedFreeQty',
            header: 'Free',
            size: 70,
            cell: ({ row }) => (
              <LineQuantityCell
                line={row.original}
                qty={row.original.expectedFreeQty}
                primaryQty={row.original.display.expectedFreePrimaryQty}
              />
            ),
          },
          {
            accessorKey: 'receivedPrimaryQty',
            header: 'Received',
            size: 110,
            cell: ({ row }) => (
              <LineQuantityCell
                line={row.original}
                qty={row.original.receivedQty}
                primaryQty={row.original.display.receivedPrimaryQty}
              />
            ),
          },
          {
            accessorKey: 'openToReceivePrimaryQty',
            header: 'To Receive',
            size: 96,
            enableSorting: false,
            cell: ({ row }) => <PrimaryQuantityCell qty={row.original.display.openToReceivePrimaryQty} />,
          },
        ],
      },
      {
        id: 'invoiced',
        header: 'Invoiced',
        columns: [
          {
            accessorKey: 'invoicedPrimaryQty',
            header: 'Invoiced',
            size: 96,
            cell: ({ row }) => <PrimaryQuantityCell qty={row.original.display.invoicedPrimaryQty} />,
          },
          {
            accessorKey: 'openToInvoicePrimaryQty',
            header: 'To Invoice',
            size: 96,
            enableSorting: false,
            cell: ({ row }) => <PrimaryQuantityCell qty={row.original.display.openToInvoicePrimaryQty} />,
          },
        ],
      },
      {
        id: 'price',
        header: 'Price',
        columns: [
          {
            accessorKey: 'unitPrice',
            header: 'Unit',
            size: 130,
            cell: ({ row }) => {
              const { unitPrice, sourceUnitPrice, primaryUomUnitPrice, uomQty, primaryUomQty, primaryUomSymbol } =
                row.original;
              const isCrossUom = primaryUomQty !== uomQty;
              return (
                <span className="flex flex-col font-mono">
                  <span>{fmt.currency(unitPrice).primary}</span>
                  {isCrossUom && (
                    <span className="text-xs text-muted-foreground">
                      {`${fmt.currency(primaryUomUnitPrice).primary} / ${primaryUomSymbol}`}
                    </span>
                  )}
                  {sourceUnitPrice && (
                    <span className="text-xs text-muted-foreground">
                      Quoted {fmt.currency(sourceUnitPrice).primary}
                    </span>
                  )}
                </span>
              );
            },
          },
          {
            accessorKey: 'totalPrice',
            header: 'Total',
            size: 130,
            cell: ({ row }) => (
              <CurrencyCell value={row.original.totalPrice} exchangeRate={purchaseOrder.exchangeRate} />
            ),
          },
        ],
      },
      {
        id: 'dates',
        header: 'Dates',
        columns: [
          {
            accessorKey: 'expectedDeliveryDate',
            header: 'Delivery',
            size: 110,
            cell: ({ row }) => (
              <ExpectedDeliveryCell
                date={row.original.expectedDeliveryDate}
                deliveryNumbers={row.original.inboundDeliveryNumbers}
                deliveryIds={row.original.inboundDeliveryIds}
                deliveryDates={row.original.inboundDeliveryDates}
              />
            ),
          },
          {
            accessorKey: 'taxDate',
            header: 'Tax',
            size: 120,
            cell: ({ row }) => (
              <TaxDateCell date={row.original.taxDate} overridden={row.original.isTaxDateOverridden} />
            ),
          },
        ],
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                permission: permissions.edit,
                disabled: areLinesLocked,
                disabledTip: lockedReason,
                dialog: {
                  title: 'Update Line Item',
                  description: 'Change the quantity, pricing and dates of this line item.',
                  className: 'max-w-3xl',
                  content: (close) => (
                    <UpdatePurchaseOrderItemDialog
                      binding={binding}
                      purchaseOrder={purchaseOrder}
                      item={row.original}
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
                disabled: areLinesLocked,
                disabledTip: lockedReason,
                onClick: () => handleRemoveItem(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [
      binding,
      purchaseOrder,
      areLinesLocked,
      lockedReason,
      permissions.edit,
      handleRemoveItem,
      fmt,
      problemsByLine,
      openProblemDocument,
    ],
  );

  const itemsTable = useDataTable({
    columns,
    query: itemsTableQuery,
    slug: binding.itemsTableSlug(purchaseOrderId),
    label: 'line item',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.itemsTableKey(purchaseOrderId) }),
  });

  const addLineItemAction = (
    <Button
      size="sm"
      permission={permissions.edit}
      startAdornment={<Plus className="size-4" />}
      onClick={addItemDialog.open}
      disabled={areLinesLocked}
      disabledTip={lockedReason}
    >
      Add Line Item
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        table={itemsTable}
        mode="tab"
        permission={permissions.view}
        toolbarActions={{ actions: addLineItemAction }}
        emptyStateConfig={{
          icon: Boxes,
          title: 'No line items',
          description: areLinesLocked
            ? 'No line items found for this purchase order.'
            : 'No line items added yet. Use "Add Line Item" to get started.',
          action: addLineItemAction,
        }}
      />

      <Dialog
        handle={addItemDialog}
        className="max-w-3xl"
        icon={ClipboardList}
        title="Add Line Item"
        description="Add an inventory item to this purchase order."
        content={(close) => (
          <AddPurchaseOrderItemDialog
            binding={binding}
            purchaseOrder={purchaseOrder}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
