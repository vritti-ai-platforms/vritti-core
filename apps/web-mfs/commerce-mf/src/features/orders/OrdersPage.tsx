import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DataTable, type ColumnDef, useDataTable } from '@vritti/quantum-ui/DataTable';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/utils/slug';
import { Eye } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommerceContext } from '../../context/CommerceContext';
import { useOrders } from '../../hooks';
import type { Order } from '../../schemas';

// Maps order status to badge variant
function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'COMPLETED':
      return 'default';
    case 'CANCELLED':
      return 'destructive';
    case 'PENDING':
      return 'outline';
    default:
      return 'secondary';
  }
}

export const OrdersPage = () => {
  const { businessUnitId } = useCommerceContext();
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useOrders({ businessUnitId });

  const columns: ColumnDef<Order, unknown>[] = useMemo(
    () => [
      { accessorKey: 'orderNumber', header: 'Order #' },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }: { row: { original: Order } }) => (
          <Badge variant="outline">{row.original.source}</Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: { row: { original: Order } }) => (
          <Badge variant={statusVariant(row.original.status)}>{row.original.status}</Badge>
        ),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }: { row: { original: Order } }) => `$${row.original.total}`,
      },
      { accessorKey: 'paymentMethod', header: 'Payment' },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }: { row: { original: Order } }) => new Date(row.original.createdAt).toLocaleString(),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }: { row: { original: Order } }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(buildSlug(row.original.orderNumber, row.original.id))}
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
    slug: 'orders',
    label: 'order',
    serverState: { result: orders, count: orders.length },
    enableRowSelection: false,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="View and manage orders" />
      <DataTable table={table} isLoading={isLoading} />
    </div>
  );
};
