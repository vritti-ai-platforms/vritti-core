import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, DateTimeCell, NumberCell, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Plus, ShoppingCart } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ORDERS_TABLE_KEY, useOrdersTable } from '@/hooks/orders';
import type { OrderChannel, OrderData, OrderStatus, OrderType } from '@/schemas/orders';
import { CreateOrderDialog } from './forms/CreateOrderDialog';

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive'; className?: string }
> = {
  PENDING: { label: 'Pending', variant: 'outline' },
  ACCEPTED: { label: 'Accepted', variant: 'secondary' },
  PREPARING: { label: 'Preparing', variant: 'secondary', className: 'bg-warning/15 text-warning' },
  READY: { label: 'Ready', variant: 'secondary', className: 'bg-success/15 text-success' },
  COMPLETED: { label: 'Completed', variant: 'secondary', className: 'bg-success/15 text-success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

const typeLabels: Record<OrderType, string> = {
  DINE_IN: 'Dine In',
  TAKEAWAY: 'Takeaway',
  DELIVERY: 'Delivery',
};

const channelLabels: Record<OrderChannel, string> = {
  ONLINE: 'Online',
  WALK_IN: 'Walk-in',
};

export const OrdersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useOrdersTable();
  const addDialog = useDialog();

  const columns = useMemo<ColumnDef<OrderData>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: 'Order #',
        cell: ({ row }) => <StringCell value={row.original.orderNumber} mono className="font-medium" />,
        enableSorting: true,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <Badge variant="outline">{typeLabels[row.original.type]}</Badge>,
      },
      {
        accessorKey: 'channel',
        header: 'Channel',
        cell: ({ row }) => channelLabels[row.original.channel],
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const config = statusConfig[row.original.status];
          return (
            <Badge variant={config.variant} className={config.className}>
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'customerName',
        header: 'Customer',
        cell: ({ row }) => row.original.customerName ?? '—',
        enableSorting: true,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total',
        cell: ({ row }) => <NumberCell value={row.original.totalAmount} />,
      },
      {
        accessorKey: 'placedAt',
        header: 'Placed At',
        cell: ({ row }) => <DateTimeCell value={row.original.placedAt} />,
        enableSorting: true,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'view',
                icon: Eye,
                label: 'View',
                onClick: () => navigate(buildSlug(row.original.orderNumber, row.original.id)),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-orders',
    label: 'order',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: ORDERS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Orders" description="View and manage customer orders" />

      <DataTable
        table={table}
        isLoading={isLoading}
        searchConfig={{
          columns: [
            { id: 'orderNumber', label: 'Order #' },
            { id: 'customerName', label: 'Customer' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              New Order
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: ShoppingCart,
          title: 'No orders',
          description: 'Orders will appear here once they are placed.',
          action: (
            <Button onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              New Order
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="New Order"
        description="Create a new order."
        content={(close) => <CreateOrderDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
