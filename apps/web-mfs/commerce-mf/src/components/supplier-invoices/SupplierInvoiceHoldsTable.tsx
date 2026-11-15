import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  DataTable,
  DateTimeCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { ShieldCheck, Unlock } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import {
  SUPPLIER_INVOICE_HOLD_LABELS,
  type SupplierInvoiceDetail,
  type SupplierInvoiceHold,
} from '@/schemas/supplier-invoices';
import type { SupplierInvoicesBinding } from './bindings';
import { ReleaseSupplierInvoiceHoldDialog } from './forms/ReleaseSupplierInvoiceHoldDialog';
import { SupplierInvoiceHoldCodeBadge, SupplierInvoiceHoldStatusBadge } from './SupplierInvoiceHoldBadges';

interface SupplierInvoiceHoldsTableProps {
  binding: SupplierInvoicesBinding;
  invoice: SupplierInvoiceDetail;
}

// The holds the invoice's lines raised, whatever their status, each naming what it found; an open one is released with
// a reason
export const SupplierInvoiceHoldsTable: React.FC<SupplierInvoiceHoldsTableProps> = ({ binding, invoice }) => {
  const lineNames = useMemo(
    () => new Map(invoice.lines.map((line) => [line.id, line.inventoryItemName ?? line.costCategoryName])),
    [invoice.lines],
  );

  const columns = useMemo<ColumnDef<SupplierInvoiceHold>[]>(
    () => [
      { accessorKey: 'code', header: 'Hold', cell: ({ row }) => <SupplierInvoiceHoldCodeBadge hold={row.original} /> },
      {
        id: 'line',
        header: 'Line',
        cell: ({ row }) => {
          const lineId = row.original.supplierInvoiceLineId;
          return <StringCell value={lineId ? lineNames.get(lineId) : 'Whole invoice'} />;
        },
      },
      { accessorKey: 'detail', header: 'Detail', meta: { grow: true } },
      {
        accessorKey: 'blocksPayment',
        header: 'Payment',
        cell: ({ row }) =>
          row.original.blocksPayment ? (
            <Badge variant="warning">Blocks payment</Badge>
          ) : (
            <Badge variant="secondary">Information</Badge>
          ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <SupplierInvoiceHoldStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'releasedAt',
        header: 'Released',
        cell: ({ row }) => <DateTimeCell value={row.original.releasedAt} />,
      },
      {
        accessorKey: 'releaseReason',
        header: 'Release Reason',
        cell: ({ row }) => <StringCell value={row.original.releaseReason} />,
      },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'release',
                icon: Unlock,
                label: 'Release',
                permission: binding.permissions.edit,
                hidden: row.original.status !== 'OPEN',
                disabled: !invoice.canEdit,
                disabledTip: 'A cancelled invoice cannot be changed',
                dialog: {
                  title: `Release "${SUPPLIER_INVOICE_HOLD_LABELS[row.original.code]}"?`,
                  description: row.original.detail,
                  content: (close) => (
                    <ReleaseSupplierInvoiceHoldDialog
                      binding={binding}
                      invoice={invoice}
                      hold={row.original}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
            ]}
          />
        ),
      },
    ],
    [binding, invoice, lineNames],
  );

  const holdsTable = useDataTable({
    columns,
    query: { data: { result: invoice.holds, count: invoice.holds.length } },
    slug: 'commerce-supplier-invoice-holds',
    label: 'hold',
    enableRowSelection: false,
    enableSorting: false,
  });

  return (
    <DataTable
      table={holdsTable}
      mode="tab"
      permission={binding.permissions.view}
      emptyStateConfig={{
        icon: ShieldCheck,
        title: 'No holds',
        description: "Every line agrees with its order and receipt within the supplier's tolerances.",
      }}
    />
  );
};
