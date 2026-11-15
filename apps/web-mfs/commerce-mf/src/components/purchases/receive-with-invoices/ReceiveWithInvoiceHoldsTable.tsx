import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, DataTable, useDataTable } from '@vritti/quantum-ui/DataTable';
import { ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import {
  SUPPLIER_INVOICE_HOLD_LABELS,
  type SupplierInvoiceHold,
  supplierInvoiceHoldStatusConfig,
} from '@/schemas/supplier-invoices';

// The holds the posted invoice raised on its payment; they are released in the supplier's invoices
export const ReceiveWithInvoiceHoldsTable = ({ holds }: { holds: SupplierInvoiceHold[] }) => {
  const columns = useMemo<ColumnDef<SupplierInvoiceHold>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Hold',
        cell: ({ row }) => SUPPLIER_INVOICE_HOLD_LABELS[row.original.code],
      },
      { accessorKey: 'detail', header: 'Detail', meta: { grow: true } },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={supplierInvoiceHoldStatusConfig[row.original.status].variant}>
            {supplierInvoiceHoldStatusConfig[row.original.status].label}
          </Badge>
        ),
      },
    ],
    [],
  );
  const holdsTable = useDataTable({
    columns,
    query: { data: { result: holds, count: holds.length } },
    slug: 'commerce-purchase-receive-with-invoice-holds',
    label: 'hold',
    enableRowSelection: false,
    enableSorting: false,
  });

  return (
    <DataTable
      table={holdsTable}
      mode="compact"
      emptyStateConfig={{
        icon: ShieldCheck,
        title: 'No holds',
        description: 'The invoice matched its orders and receipts; it can be paid when due.',
      }}
    />
  );
};
