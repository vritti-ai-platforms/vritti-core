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
import { useOrder, useUpdateOrderStatus } from '../../hooks';
import type { OrderItem } from '../../schemas';

// Maps item status to badge variant
function itemStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'SERVED':
      return 'default';
    case 'CANCELLED':
      return 'destructive';
    case 'PENDING':
      return 'outline';
    default:
      return 'secondary';
  }
}

// Next valid status transitions
function getNextStatuses(currentStatus: string): string[] {
  switch (currentStatus) {
    case 'PENDING':
      return ['ACCEPTED', 'CANCELLED'];
    case 'ACCEPTED':
      return ['PREPARING', 'CANCELLED'];
    case 'PREPARING':
      return ['READY', 'CANCELLED'];
    case 'READY':
      return ['COMPLETED'];
    default:
      return [];
  }
}

export const OrderDetailPage = () => {
  const { id } = useSlugParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id);
  const updateStatusMutation = useUpdateOrderStatus();

  const itemColumns: ColumnDef<OrderItem, unknown>[] = useMemo(
    () => [
      { accessorKey: 'name', header: 'Item' },
      { accessorKey: 'quantity', header: 'Qty' },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }: { row: { original: OrderItem } }) => `$${row.original.unitPrice}`,
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }: { row: { original: OrderItem } }) => `$${row.original.total}`,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: { row: { original: OrderItem } }) => (
          <Badge variant={itemStatusVariant(row.original.status)}>{row.original.status}</Badge>
        ),
      },
      {
        accessorKey: 'kotNumber',
        header: 'KOT #',
        cell: ({ row }: { row: { original: OrderItem } }) => row.original.kotNumber ?? '-',
      },
    ],
    [],
  );

  const items = order?.items ?? [];

  const { table: itemsTable } = useDataTable({
    columns: itemColumns,
    slug: 'order-items',
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

  if (!order) {
    return (
      <div className="flex items-center justify-center py-20">
        <Typography intent="muted">Order not found</Typography>
      </div>
    );
  }

  const nextStatuses = getNextStatuses(order.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`${order.source} order - ${order.paymentMethod}`}
        actions={
          <div className="flex gap-2">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                variant={status === 'CANCELLED' ? 'destructive' : 'default'}
                size="sm"
                isLoading={updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate({ id: order.id, status })}
              >
                {status}
              </Button>
            ))}
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <Typography variant="h4">Summary</Typography>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <Typography intent="muted">Status</Typography>
              <Badge>{order.status}</Badge>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Subtotal</Typography>
              <Typography>${order.subtotal}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Tax</Typography>
              <Typography>${order.tax}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Discount</Typography>
              <Typography>${order.discount}</Typography>
            </div>
            <div className="flex justify-between font-semibold">
              <Typography>Total</Typography>
              <Typography>${order.total}</Typography>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Typography variant="h4">Customer</Typography>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <Typography intent="muted">Phone</Typography>
              <Typography>{order.customerPhone ?? '-'}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Notes</Typography>
              <Typography>{order.notes ?? '-'}</Typography>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Typography variant="h4">Details</Typography>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <Typography intent="muted">Source</Typography>
              <Badge variant="outline">{order.source}</Badge>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Payment</Typography>
              <Typography>{order.paymentMethod}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Created</Typography>
              <Typography>{new Date(order.createdAt).toLocaleString()}</Typography>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Typography variant="h4">Items</Typography>
        </CardHeader>
        <CardContent>
          <DataTable table={itemsTable} />
        </CardContent>
      </Card>
    </div>
  );
};
