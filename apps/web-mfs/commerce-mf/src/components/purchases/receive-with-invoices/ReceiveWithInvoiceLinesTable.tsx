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
import { Typography } from '@vritti/quantum-ui/Typography';
import { PackagePlus, Pencil, Trash2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { type ReceiveWithInvoiceTableLine, receiveWithInvoiceLineTotal } from './receiveWithInvoiceLines';

interface ReceiveWithInvoiceLineRow {
  index: number;
  line: ReceiveWithInvoiceTableLine;
}

interface ReceiveWithInvoiceLinesTableProps {
  lines: ReceiveWithInvoiceTableLine[];
  currencyCode: string;
  isLoading: boolean;
  // Editing a draft: the line's dialog and its removal; a posted invoice's lines are read only
  editing?: {
    permission: string;
    renderEdit: (index: number, close: () => void) => React.ReactNode;
    onRemove: (index: number) => void;
  };
  toolbarAction?: React.ReactNode;
}

// The invoice's lines: the item each receives and the purchase it belongs to, its batch, quantity and free goods in the
// allocation's unit, and its amounts in the invoice currency
export const ReceiveWithInvoiceLinesTable: React.FC<ReceiveWithInvoiceLinesTableProps> = ({
  lines,
  currencyCode,
  isLoading,
  editing,
  toolbarAction,
}) => {
  const rows = useMemo<ReceiveWithInvoiceLineRow[]>(() => lines.map((line, index) => ({ index, line })), [lines]);

  const columns = useMemo<ColumnDef<ReceiveWithInvoiceLineRow>[]>(
    () => [
      {
        id: 'item',
        header: 'Item',
        meta: { grow: true },
        cell: ({ row }) => (
          <span className="flex flex-col">
            <span>{row.original.line.inventoryItemName}</span>
            <Typography variant="caption" intent="muted">
              {row.original.line.purchaseNumber}
            </Typography>
          </span>
        ),
      },
      {
        id: 'batch',
        header: 'Batch',
        cell: ({ row }) => (
          <span className="flex flex-col">
            <StringCell value={row.original.line.lotNumber} mono />
            {row.original.line.expiryDate && <DateCell value={row.original.line.expiryDate} />}
          </span>
        ),
      },
      {
        id: 'quantity',
        header: 'Qty',
        cell: ({ row }) => (
          <span className="flex items-baseline gap-1">
            <NumberCell value={row.original.line.quantity} />
            {row.original.line.uomSymbol && (
              <Typography variant="caption" intent="muted">
                {row.original.line.uomSymbol}
              </Typography>
            )}
          </span>
        ),
      },
      {
        id: 'freeQty',
        header: 'Free',
        cell: ({ row }) => <NumberCell value={row.original.line.freeQty} />,
      },
      {
        id: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }) => <CurrencyCell value={row.original.line.unitPrice} />,
      },
      {
        id: 'discountAmount',
        header: 'Discount',
        cell: ({ row }) => <CurrencyCell value={row.original.line.discountAmount} />,
      },
      {
        id: 'taxAmount',
        header: 'Tax',
        cell: ({ row }) => <CurrencyCell value={row.original.line.taxAmount} />,
      },
      {
        id: 'lineTotal',
        header: 'Total',
        cell: ({ row }) => <CurrencyCell value={receiveWithInvoiceLineTotal(row.original.line, currencyCode)} />,
      },
      ...(editing
        ? [
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
                      permission: editing.permission,
                      dialog: {
                        title: 'Edit Line',
                        description: 'Change what the line receives and invoices.',
                        className: 'max-w-2xl',
                        content: (close) => editing.renderEdit(row.original.index, close),
                      },
                    },
                    {
                      id: 'remove',
                      icon: Trash2,
                      label: 'Remove',
                      variant: 'destructive',
                      permission: editing.permission,
                      onClick: () => editing.onRemove(row.original.index),
                    },
                  ]}
                />
              ),
            } satisfies ColumnDef<ReceiveWithInvoiceLineRow>,
          ]
        : []),
    ],
    [currencyCode, editing],
  );

  const linesTable = useDataTable({
    columns,
    query: { data: { result: rows, count: rows.length }, isLoading },
    slug: 'commerce-purchase-receive-with-invoice-lines',
    label: 'line',
    enableRowSelection: false,
    enableSorting: false,
  });

  return (
    <DataTable
      table={linesTable}
      mode="compact"
      toolbarActions={toolbarAction ? { actions: toolbarAction } : undefined}
      emptyStateConfig={{
        icon: PackagePlus,
        title: 'No lines yet',
        description: 'Add a line for each item and batch on the invoice.',
        action: toolbarAction,
      }}
    />
  );
};
