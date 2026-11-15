import { useQueryClient } from '@tanstack/react-query';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  type DataTableQuery,
  DateCell,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { ValueFilter } from '@vritti/quantum-ui/ValueFilter';
import { Eye, ReceiptText } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SUPPLIER_INVOICE_STATUS_LABELS,
  type SupplierInvoice,
  supplierInvoicePaymentStatusConfig,
} from '@/schemas/supplier-invoices';
import type { SupplierInvoicesListBinding } from './bindings';
import { SupplierInvoiceOpenHoldCount } from './SupplierInvoiceHoldBadges';
import { SupplierInvoicePaymentStatusBadge } from './SupplierInvoicePaymentStatusBadge';
import { SupplierInvoiceStatusBadge } from './SupplierInvoiceStatusBadge';

interface SupplierInvoicesTableProps {
  binding: SupplierInvoicesListBinding;
  mode: 'page' | 'tab';
  query: DataTableQuery<SupplierInvoice>;
  slug: string;
  queryKey: readonly unknown[];
  supplierId?: string;
  purchaseOrderId?: string;
  contextBar?: React.ReactNode;
  addAction: React.ReactNode;
  emptyDescription: string;
}

const STATUS_OPTIONS = Object.entries(SUPPLIER_INVOICE_STATUS_LABELS).map(([value, label]) => ({ label, value }));
const PAYMENT_STATUS_OPTIONS = Object.entries(supplierInvoicePaymentStatusConfig).map(([value, { label }]) => ({
  label,
  value,
}));

// Supplier invoices, newest first, with the orders they cover, their payment and the holds blocking it; a list narrowed
// to a supplier drops that column, and an order's list drops its one site
export const SupplierInvoicesTable: React.FC<SupplierInvoicesTableProps> = ({
  binding,
  mode,
  query,
  slug,
  queryKey,
  supplierId,
  purchaseOrderId,
  contextBar,
  addAction,
  emptyDescription,
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const showSupplier = !supplierId && !purchaseOrderId;
  const showSite = binding.spansSites && !purchaseOrderId;

  const columns = useMemo<ColumnDef<SupplierInvoice>[]>(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice',
        cell: ({ row }) => <StringCell value={row.original.invoiceNumber} mono />,
      },
      {
        accessorKey: 'invoiceDate',
        header: 'Date',
        cell: ({ row }) => <DateCell value={row.original.invoiceDate} />,
      },
      ...(showSupplier
        ? [{ accessorKey: 'supplierName', header: 'Supplier' } satisfies ColumnDef<SupplierInvoice>]
        : []),
      {
        accessorKey: 'poNumbers',
        header: 'Purchase Orders',
        enableSorting: false,
        cell: ({ row }) => (
          <StringCell value={row.original.poNumbers.length > 0 ? row.original.poNumbers.join(', ') : null} mono />
        ),
      },
      ...(showSite
        ? [
            {
              id: 'site',
              header: 'Site',
              enableSorting: false,
              cell: ({ row }) => <StringCell value={row.original.siteName} />,
            } satisfies ColumnDef<SupplierInvoice>,
          ]
        : []),
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <SupplierInvoiceStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Payment',
        cell: ({ row }) => <SupplierInvoicePaymentStatusBadge status={row.original.paymentStatus} />,
      },
      {
        accessorKey: 'dueDate',
        header: 'Due',
        cell: ({ row }) => <DateCell value={row.original.dueDate} />,
      },
      {
        accessorKey: 'lineCount',
        header: 'Lines',
        enableSorting: false,
        cell: ({ row }) => <NumberCell value={row.original.lineCount} />,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total',
        enableSorting: false,
        cell: ({ row }) => <CurrencyCell value={row.original.totalAmount} exchangeRate={row.original.exchangeRate} />,
      },
      {
        accessorKey: 'openHoldCount',
        header: 'Holds',
        cell: ({ row }) => <SupplierInvoiceOpenHoldCount count={row.original.openHoldCount} />,
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
                id: 'view',
                icon: Eye,
                label: 'View',
                permission: binding.permissions.view,
                onClick: () => navigate(binding.invoicePath(row.original), { relative: 'path' }),
              },
            ]}
          />
        ),
      },
    ],
    [binding, navigate, showSupplier, showSite],
  );

  const supplierInvoicesTable = useDataTable({
    columns,
    query,
    slug,
    label: 'invoice',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey }),
  });

  return (
    <DataTable
      table={supplierInvoicesTable}
      mode={mode}
      permission={binding.permissions.view}
      searchConfig={{
        columns: [
          { id: 'invoiceNumber', label: 'Invoice' },
          ...(showSupplier ? [{ id: 'supplierName', label: 'Supplier' }] : []),
          { id: 'poNumbers', label: 'Purchase Order' },
        ],
        searchAll: true,
      }}
      filters={[
        <SelectFilter key="status" name="status" label="Status" options={STATUS_OPTIONS} multiple />,
        <SelectFilter
          key="paymentStatus"
          name="paymentStatus"
          label="Payment"
          options={PAYMENT_STATUS_OPTIONS}
          multiple
        />,
        <ValueFilter key="openHoldCount" name="openHoldCount" label="Holds" fieldType="number" />,
      ]}
      contextBar={contextBar}
      toolbarActions={{ actions: addAction }}
      emptyStateConfig={{ icon: ReceiptText, title: 'No invoices', description: emptyDescription, action: addAction }}
    />
  );
};
