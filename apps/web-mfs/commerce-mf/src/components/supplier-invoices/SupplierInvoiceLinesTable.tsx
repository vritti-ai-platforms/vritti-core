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
import { useConfirm, useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { ListPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import type { SupplierInvoiceDetail, SupplierInvoiceLine } from '@/schemas/supplier-invoices';
import type { SupplierInvoicesBinding } from './bindings';
import { SupplierInvoiceLineDialog } from './forms/SupplierInvoiceLineDialog';
import { invoiceLineMrp } from './lineMrp';
import { SupplierInvoiceFlagBadges } from './SupplierInvoiceFlags';

interface SupplierInvoiceLinesTableProps {
  binding: SupplierInvoicesBinding;
  invoice: SupplierInvoiceDetail;
}

const CANCELLED_TIP = 'A cancelled invoice cannot be changed';

// An invoice's billed lines with their batch, amounts, the receipts they bill and their match flags
export const SupplierInvoiceLinesTable: React.FC<SupplierInvoiceLinesTableProps> = ({ binding, invoice }) => {
  const fmt = useFormatters();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const removeMutation = binding.useRemoveLine();
  const isPosted = invoice.status === 'POSTED';

  const handleRemove = useCallback(
    async (line: SupplierInvoiceLine) => {
      const confirmed = await confirm({
        title: `Remove "${line.inventoryItemName}"?`,
        description: isPosted
          ? 'The line is removed from the posted invoice and the stock it billed goes back to its provisional cost.'
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
      { accessorKey: 'inventoryItemName', header: 'Item' },
      { accessorKey: 'uomSymbol', header: 'Unit', cell: ({ row }) => <StringCell value={row.original.uomSymbol} /> },
      {
        accessorKey: 'lotNumber',
        header: 'Batch',
        cell: ({ row }) => <StringCell value={row.original.lotNumber} mono />,
      },
      { accessorKey: 'expiryDate', header: 'Expiry', cell: ({ row }) => <DateCell value={row.original.expiryDate} /> },
      { accessorKey: 'mrp', header: 'MRP', cell: ({ row }) => <CurrencyCell value={invoiceLineMrp(row.original)} /> },
      { accessorKey: 'billedQty', header: 'Billed', cell: ({ row }) => <NumberCell value={row.original.billedQty} /> },
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
        id: 'receipts',
        header: 'Receipts',
        cell: ({ row }) =>
          row.original.receipts.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {row.original.receipts.map((receipt) => (
                <span key={`${receipt.goodsReceiptId}-${receipt.lotNumber}`} className="text-sm">
                  <StringCell value={receipt.grNumber} mono />
                  {receipt.lotNumber && <span className="text-muted-foreground"> · {receipt.lotNumber}</span>}
                  <span className="text-muted-foreground"> × {fmt.number(receipt.quantity).primary}</span>
                </span>
              ))}
            </div>
          ) : (
            <StringCell value={null} />
          ),
      },
      {
        id: 'flags',
        header: 'Flags',
        cell: ({ row }) => <SupplierInvoiceFlagBadges flags={row.original.flags} />,
      },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
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
                  title: 'Edit Line',
                  className: 'max-w-2xl',
                  description: `Change what the invoice bills for ${row.original.inventoryItemName}.`,
                  content: (close) => (
                    <SupplierInvoiceLineDialog
                      binding={binding}
                      invoice={invoice}
                      line={row.original}
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
                onClick: () => handleRemove(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [binding, invoice, isPosted, fmt, handleRemove],
  );

  const linesTable = useDataTable({
    columns,
    query: { data: { result: invoice.lines, count: invoice.lines.length } },
    slug: 'commerce-supplier-invoice-lines',
    label: 'line',
    enableRowSelection: false,
    enableSorting: false,
  });

  const addButton = (
    <Button
      size="sm"
      permission={binding.permissions.edit}
      startAdornment={<Plus className="size-4" />}
      onClick={addDialog.open}
      disabled={!invoice.canEdit}
      disabledTip={CANCELLED_TIP}
    >
      Add Line
    </Button>
  );

  return (
    <>
      <DataTable
        table={linesTable}
        mode="tab"
        permission={binding.permissions.view}
        toolbarActions={{ actions: addButton }}
        emptyStateConfig={{
          icon: ListPlus,
          title: 'No lines yet',
          description: 'Add a line for each item and batch the supplier billed.',
          action: addButton,
        }}
      />
      <Dialog
        handle={addDialog}
        icon={ListPlus}
        title="Add Line"
        className="max-w-2xl"
        description={`Bill one of the lines of purchase order ${invoice.poNumber}.`}
        content={(close) => (
          <SupplierInvoiceLineDialog binding={binding} invoice={invoice} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
