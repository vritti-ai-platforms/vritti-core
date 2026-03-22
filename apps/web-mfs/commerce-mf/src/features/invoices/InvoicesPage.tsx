import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DataTable, type ColumnDef, useDataTable } from '@vritti/quantum-ui/DataTable';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/utils/slug';
import { Eye } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommerceContext } from '../../context/CommerceContext';
import { useInvoices } from '../../hooks';
import type { Invoice } from '../../schemas';

// Maps invoice status to badge variant
function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PAID':
      return 'default';
    case 'CANCELLED':
      return 'destructive';
    case 'DRAFT':
      return 'outline';
    default:
      return 'secondary';
  }
}

export const InvoicesPage = () => {
  const { businessUnitId } = useCommerceContext();
  const navigate = useNavigate();
  const { data: invoices = [], isLoading } = useInvoices(businessUnitId);

  const columns: ColumnDef<Invoice, unknown>[] = useMemo(
    () => [
      { accessorKey: 'invoiceNumber', header: 'Invoice #' },
      { accessorKey: 'customerName', header: 'Customer' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: { row: { original: Invoice } }) => (
          <Badge variant={statusVariant(row.original.status)}>{row.original.status}</Badge>
        ),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }: { row: { original: Invoice } }) => `$${row.original.total}`,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }: { row: { original: Invoice } }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }: { row: { original: Invoice } }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(buildSlug(row.original.invoiceNumber, row.original.id))}
            >
              <Eye className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'invoices',
    label: 'invoice',
    serverState: { result: invoices, count: invoices.length },
    enableRowSelection: false,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="View and manage invoices" />
      <DataTable table={table} isLoading={isLoading} />
    </div>
  );
};
