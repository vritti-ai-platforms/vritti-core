import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  DateCell,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { ListPlus, Pencil, Plus, Trash2, Truck } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  SUPPLIER_INVOICE_LINE_TYPE_LABELS,
  type SupplierInvoiceDetail,
  type SupplierInvoiceLine,
} from '@/schemas/supplier-invoices';
import type { SupplierInvoicesBinding } from './bindings';
import { SupplierInvoiceChargeLineDialog } from './forms/SupplierInvoiceChargeLineDialog';
import { SupplierInvoiceItemLineDialog } from './forms/SupplierInvoiceItemLineDialog';
import { invoiceLineMrp } from './lineMrp';
import { SupplierInvoiceLineHolds } from './SupplierInvoiceHoldBadges';

interface SupplierInvoiceLinesTableProps {
  binding: SupplierInvoicesBinding;
  invoice: SupplierInvoiceDetail;
}

const CANCELLED_TIP = 'A cancelled invoice cannot be changed';

// An invoice's lines: received batches it covers, with the receipt's batch, expiry and MRP, and landed charges; each
// with its amounts and the holds it raised
export const SupplierInvoiceLinesTable: React.FC<SupplierInvoiceLinesTableProps> = ({ binding, invoice }) => {
  const confirm = useConfirm();
  const addItemDialog = useDialog();
  const addChargeDialog = useDialog();
  const removeMutation = binding.useRemoveLine();
  const isPosted = invoice.status === 'POSTED';

  const handleRemove = useCallback(
    async (line: SupplierInvoiceLine) => {
      const confirmed = await confirm({
        title: `Remove "${line.inventoryItemName ?? line.costCategoryName}"?`,
        description: isPosted
          ? 'The line is removed from the posted invoice: the stock it invoiced goes back to its provisional cost and its order is open to invoice again.'
          : 'The line is removed from the invoice.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeMutation.mutate({ invoice, lineId: line.id });
    },
    [confirm, removeMutation, invoice, isPosted],
  );

  const columns = useMemo<ColumnDef<SupplierInvoiceLine>[]>(
    () => [
      {
        accessorKey: 'lineType',
        header: 'Type',
        cell: ({ row }) => SUPPLIER_INVOICE_LINE_TYPE_LABELS[row.original.lineType],
      },
      {
        id: 'name',
        header: 'Item / Charge',
        meta: { grow: true },
        cell: ({ row }) => (
          <span className="flex flex-col">
            <span>{row.original.inventoryItemName ?? row.original.costCategoryName}</span>
            {row.original.description && (
              <span className="text-xs text-muted-foreground">{row.original.description}</span>
            )}
          </span>
        ),
      },
      {
        id: 'receipt',
        header: 'Receipt',
        cell: ({ row }) => (
          <span className="flex flex-col">
            <StringCell value={row.original.grNumber} mono />
            {row.original.poNumber && (
              <span className="text-xs text-muted-foreground">
                <StringCell value={row.original.poNumber} mono />
              </span>
            )}
          </span>
        ),
      },
      {
        accessorKey: 'lotNumber',
        header: 'Batch',
        cell: ({ row }) => <StringCell value={row.original.lotNumber} mono />,
      },
      { accessorKey: 'expiryDate', header: 'Expiry', cell: ({ row }) => <DateCell value={row.original.expiryDate} /> },
      { accessorKey: 'mrp', header: 'MRP', cell: ({ row }) => <CurrencyCell value={invoiceLineMrp(row.original)} /> },
      { accessorKey: 'uomSymbol', header: 'Unit', cell: ({ row }) => <StringCell value={row.original.uomSymbol} /> },
      {
        accessorKey: 'invoicedQty',
        header: 'Invoiced',
        cell: ({ row }) => <NumberCell value={row.original.invoicedQty} />,
      },
      { accessorKey: 'freeQty', header: 'Free', cell: ({ row }) => <NumberCell value={row.original.freeQty} /> },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }) => <CurrencyCell value={row.original.unitPrice} />,
      },
      {
        accessorKey: 'discountAmount',
        header: 'Discount',
        cell: ({ row }) => <CurrencyCell value={row.original.discountAmount} />,
      },
      { accessorKey: 'taxAmount', header: 'Tax', cell: ({ row }) => <CurrencyCell value={row.original.taxAmount} /> },
      {
        accessorKey: 'lineTotal',
        header: 'Line Total',
        cell: ({ row }) => <CurrencyCell value={row.original.lineTotal} />,
      },
      ...(isPosted
        ? [
            {
              accessorKey: 'varianceAmount',
              header: 'Variance',
              cell: ({ row }) => <CurrencyCell value={row.original.varianceAmount} />,
            } satisfies ColumnDef<SupplierInvoiceLine>,
          ]
        : []),
      {
        id: 'holds',
        header: 'Holds',
        cell: ({ row }) => <SupplierInvoiceLineHolds holds={row.original.holds} />,
      },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const line = row.original;
          const isCharge = line.lineType === 'CHARGE';
          return (
            <RowActions
              actions={[
                {
                  id: 'edit',
                  icon: Pencil,
                  label: 'Edit',
                  permission: binding.permissions.edit,
                  disabled: !invoice.canEdit,
                  disabledTip: CANCELLED_TIP,
                  dialog: {
                    title: isCharge ? 'Edit Charge' : 'Edit Line',
                    className: 'max-w-2xl',
                    description: `Change what the invoice covers for ${line.inventoryItemName ?? line.costCategoryName}.`,
                    content: (close) =>
                      isCharge ? (
                        <SupplierInvoiceChargeLineDialog
                          binding={binding}
                          invoice={invoice}
                          line={line}
                          onSuccess={close}
                          onCancel={close}
                        />
                      ) : (
                        <SupplierInvoiceItemLineDialog
                          binding={binding}
                          invoice={invoice}
                          line={line}
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
                  permission: binding.permissions.edit,
                  disabled: !invoice.canEdit,
                  disabledTip: CANCELLED_TIP,
                  onClick: () => handleRemove(line),
                },
              ]}
            />
          );
        },
      },
    ],
    [binding, invoice, isPosted, handleRemove],
  );

  const linesTable = useDataTable({
    columns,
    query: { data: { result: invoice.lines, count: invoice.lines.length } },
    slug: 'commerce-supplier-invoice-lines',
    label: 'line',
    enableRowSelection: false,
    enableSorting: false,
  });

  const addActions = (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        permission={binding.permissions.edit}
        startAdornment={<Truck className="size-4" />}
        onClick={addChargeDialog.open}
        disabled={!invoice.canEdit}
        disabledTip={CANCELLED_TIP}
      >
        Add Charge
      </Button>
      <Button
        size="sm"
        permission={binding.permissions.edit}
        startAdornment={<Plus className="size-4" />}
        onClick={addItemDialog.open}
        disabled={!invoice.canEdit}
        disabledTip={CANCELLED_TIP}
      >
        Add Line
      </Button>
    </div>
  );

  return (
    <>
      <DataTable
        table={linesTable}
        mode="tab"
        permission={binding.permissions.view}
        toolbarActions={{ actions: addActions }}
        emptyStateConfig={{
          icon: ListPlus,
          title: 'No lines yet',
          description: 'Add a line for each received batch the supplier invoiced, and a charge for freight or duty.',
          action: addActions,
        }}
      />
      <Dialog
        handle={addItemDialog}
        icon={ListPlus}
        title="Add Line"
        className="max-w-2xl"
        description={`Invoice a batch ${invoice.supplierName} delivered and the site received.`}
        content={(close) => (
          <SupplierInvoiceItemLineDialog binding={binding} invoice={invoice} onSuccess={close} onCancel={close} />
        )}
      />
      <Dialog
        handle={addChargeDialog}
        icon={Truck}
        title="Add Charge"
        className="max-w-2xl"
        description="A landed cost on the invoice, spread over the stock its lines cover when it is posted."
        content={(close) => (
          <SupplierInvoiceChargeLineDialog binding={binding} invoice={invoice} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
