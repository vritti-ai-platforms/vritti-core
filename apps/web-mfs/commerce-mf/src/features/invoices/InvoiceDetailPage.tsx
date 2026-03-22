import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader } from '@vritti/quantum-ui/Card';
import { DataTable, type ColumnDef, useDataTable } from '@vritti/quantum-ui/DataTable';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Typography } from '@vritti/quantum-ui/Typography';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice, useUpdateInvoiceStatus } from '../../hooks';
import type { InvoiceLineItem } from '../../schemas';

export const InvoiceDetailPage = () => {
  const { id } = useSlugParams();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(id);
  const updateStatusMutation = useUpdateInvoiceStatus();

  const itemColumns: ColumnDef<InvoiceLineItem, unknown>[] = useMemo(
    () => [
      { accessorKey: 'name', header: 'Item' },
      { accessorKey: 'quantity', header: 'Qty' },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }: { row: { original: InvoiceLineItem } }) => `$${row.original.unitPrice}`,
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }: { row: { original: InvoiceLineItem } }) => `$${row.original.total}`,
      },
    ],
    [],
  );

  const items = invoice?.items ?? [];

  const { table: itemsTable } = useDataTable({
    columns: itemColumns,
    slug: 'invoice-items',
    label: 'item',
    serverState: { result: items, count: items.length },
    enableRowSelection: false,
    enableSorting: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center py-20">
        <Typography intent="muted">Invoice not found</Typography>
      </div>
    );
  }

  // Determine available status transitions
  const canMarkIssued = invoice.status === 'DRAFT';
  const canMarkPaid = invoice.status === 'ISSUED';
  const canCancel = invoice.status === 'DRAFT' || invoice.status === 'ISSUED';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description={`Order: ${invoice.orderId}`}
        actions={
          <div className="flex gap-2">
            {canMarkIssued && (
              <Button
                size="sm"
                isLoading={updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'ISSUED' })}
              >
                Mark Issued
              </Button>
            )}
            {canMarkPaid && (
              <Button
                size="sm"
                isLoading={updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'PAID' })}
              >
                Mark Paid
              </Button>
            )}
            {canCancel && (
              <Button
                variant="destructive"
                size="sm"
                isLoading={updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'CANCELLED' })}
              >
                Cancel
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Typography variant="h4">Invoice Details</Typography>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <Typography intent="muted">Status</Typography>
              <Badge>{invoice.status}</Badge>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Customer</Typography>
              <Typography>{invoice.customerName ?? '-'}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Phone</Typography>
              <Typography>{invoice.customerPhone ?? '-'}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Issued At</Typography>
              <Typography>{invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleString() : '-'}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Paid At</Typography>
              <Typography>{invoice.paidAt ? new Date(invoice.paidAt).toLocaleString() : '-'}</Typography>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Typography variant="h4">Totals</Typography>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <Typography intent="muted">Subtotal</Typography>
              <Typography>${invoice.subtotal}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Tax</Typography>
              <Typography>${invoice.tax}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Discount</Typography>
              <Typography>${invoice.discount}</Typography>
            </div>
            <div className="flex justify-between font-semibold">
              <Typography>Total</Typography>
              <Typography>${invoice.total}</Typography>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Typography variant="h4">Line Items</Typography>
        </CardHeader>
        <CardContent>
          <DataTable table={itemsTable} />
        </CardContent>
      </Card>
    </div>
  );
};
