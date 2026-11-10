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
import { SUPPLIER_INVOICE_STATUS_LABELS, type SupplierInvoice } from '@/schemas/supplier-invoices';
import { AddSupplierInvoiceAction } from './AddSupplierInvoiceAction';
import type { SupplierInvoicesListBinding } from './bindings';
import { SupplierInvoiceFlagCount } from './SupplierInvoiceFlags';
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
  emptyDescription: string;
}

const STATUS_OPTIONS = Object.entries(SUPPLIER_INVOICE_STATUS_LABELS).map(([value, label]) => ({ label, value }));

// Supplier invoices, newest first, with their match flags; a list narrowed to a supplier or purchase order drops that
// column (an order's also drops its one site), and its new invoices bill it
export const SupplierInvoicesTable: React.FC<SupplierInvoicesTableProps> = ({
  binding,
  mode,
  query,
  slug,
  queryKey,
  supplierId,
  purchaseOrderId,
  contextBar,
  emptyDescription,
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const showSupplier = !supplierId && !purchaseOrderId;
  const showPurchaseOrder = !purchaseOrderId;
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
      ...(showPurchaseOrder
        ? [
            {
              accessorKey: 'poNumber',
              header: 'Purchase Order',
              cell: ({ row }) => <StringCell value={row.original.poNumber} mono />,
            } satisfies ColumnDef<SupplierInvoice>,
          ]
        : []),
      ...(showSite
        ? [
            {
              id: 'site',
              header: 'Site',
              enableSorting: false,
              cell: ({ row }) => <StringCell value={row.original.siteName ?? row.original.siteCode} />,
            } satisfies ColumnDef<SupplierInvoice>,
          ]
        : []),
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <SupplierInvoiceStatusBadge status={row.original.status} />,
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
        accessorKey: 'flagCount',
        header: 'Flags',
        cell: ({ row }) => <SupplierInvoiceFlagCount count={row.original.flagCount} />,
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
    [binding, navigate, showSupplier, showPurchaseOrder, showSite],
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

  const addAction = (
    <AddSupplierInvoiceAction binding={binding} supplierId={supplierId} purchaseOrderId={purchaseOrderId} />
  );

  return (
    <DataTable
      table={supplierInvoicesTable}
      mode={mode}
      permission={binding.permissions.view}
      onRowClick={(invoice) => navigate(binding.invoicePath(invoice), { relative: 'path' })}
      searchConfig={{
        columns: [
          { id: 'invoiceNumber', label: 'Invoice' },
          ...(showSupplier ? [{ id: 'supplierName', label: 'Supplier' }] : []),
          ...(showPurchaseOrder ? [{ id: 'poNumber', label: 'Purchase Order' }] : []),
        ],
        searchAll: true,
      }}
      filters={[
        <SelectFilter key="status" name="status" label="Status" options={STATUS_OPTIONS} multiple />,
        <ValueFilter key="flagCount" name="flagCount" label="Flags" fieldType="number" />,
      ]}
      contextBar={contextBar}
      toolbarActions={{ actions: addAction }}
      emptyStateConfig={{ icon: ReceiptText, title: 'No invoices', description: emptyDescription, action: addAction }}
    />
  );
};
