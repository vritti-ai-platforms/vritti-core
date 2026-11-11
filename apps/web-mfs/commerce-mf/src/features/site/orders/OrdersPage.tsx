import { useQueryClient } from '@tanstack/react-query';
import { SITE_ORDERS } from '@vritti/commerce-permissions/orders';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateTimeCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Plus, ShoppingCart } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { ORDERS_TABLE_KEY, useOrdersTable } from '@/hooks/site/orders';
import type { OrderData } from '@/schemas/orders';
import { OrderAmount } from './components/OrderAmount';
import { ORDER_CHANNEL_LABELS, ORDER_STATUS, ORDER_TYPE_LABELS } from './components/order-labels';
import { CreateOrderDialog } from './forms/CreateOrderDialog';

export const OrdersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ordersTableQuery = useOrdersTable();
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
        cell: ({ row }) => <Badge variant="outline">{ORDER_TYPE_LABELS[row.original.type]}</Badge>,
      },
      {
        accessorKey: 'channel',
        header: 'Channel',
        cell: ({ row }) => ORDER_CHANNEL_LABELS[row.original.channel],
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const config = ORDER_STATUS[row.original.status];
          return (
            <div className="flex items-center gap-1.5">
              <Badge variant={config.variant} className={config.className}>
                {config.label}
              </Badge>
              {/* Paid after it was cancelled: staff check with the shopper before preparing it */}
              {row.original.needsReview && (
                <Badge variant="secondary" className="bg-warning/15 text-warning">
                  Review
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'customerName',
        header: 'Customer',
        cell: ({ row }) => <StringCell value={row.original.customerName} />,
        enableSorting: true,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total',
        cell: ({ row }) => (
          <span className="font-mono">
            <OrderAmount minor={row.original.totalAmount} currencyCode={row.original.currencyCode} />
          </span>
        ),
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

  const ordersTable = useDataTable({
    columns,
    slug: 'commerce-site-orders',
    label: 'order',
    query: ordersTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: ORDERS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Orders" description="View and manage customer orders" />

      <DataTable
        table={ordersTable}
        searchConfig={{
          columns: [
            { id: 'orderNumber', label: 'Order #' },
            { id: 'customerName', label: 'Customer' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button size="sm" permission={SITE_ORDERS.add} onClick={addDialog.open}>
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
            <Button permission={SITE_ORDERS.add} onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              New Order
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={ShoppingCart}
        title="New Order"
        description="Create a new order."
        content={(close) => <CreateOrderDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
