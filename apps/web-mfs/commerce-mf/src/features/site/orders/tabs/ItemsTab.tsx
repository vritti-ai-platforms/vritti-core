import { SITE_ORDERS } from '@vritti/commerce-permissions/orders';
import { type ColumnDef, DataTable, NumberCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Package } from 'lucide-react';
import { useMemo } from 'react';
import type { OrderDetail, OrderItemData } from '@/schemas/orders';
import { OrderAmount } from '../components/OrderAmount';

interface ItemsTabProps {
  order: OrderDetail;
}

// What was ordered: each line as it read when the order was placed, with its quantity and amounts
export const ItemsTab = ({ order }: ItemsTabProps) => {
  const columns = useMemo<ColumnDef<OrderItemData>[]>(() => {
    const amount = (minor: string) => (
      <span className="font-mono">
        <OrderAmount minor={minor} currencyCode={order.currencyCode} />
      </span>
    );
    return [
      {
        accessorKey: 'name',
        header: 'Item',
        cell: ({ row }) => (
          <div>
            {/* Built when the order was placed, so it reads as it did then */}
            <span className="font-medium">{row.original.name}</span>
            {row.original.notes && <p className="mt-0.5 text-muted-foreground text-xs">{row.original.notes}</p>}
          </div>
        ),
      },
      { accessorKey: 'quantity', header: 'Qty', cell: ({ row }) => <NumberCell value={row.original.quantity} /> },
      { accessorKey: 'unitPrice', header: 'Unit Price', cell: ({ row }) => amount(row.original.unitPrice) },
      { accessorKey: 'taxAmount', header: 'Tax', cell: ({ row }) => amount(row.original.taxAmount) },
      { accessorKey: 'total', header: 'Total', cell: ({ row }) => amount(row.original.total) },
    ];
  }, [order.currencyCode]);

  const itemsTable = useDataTable({
    columns,
    query: { data: { result: order.items, count: order.items.length } },
    slug: 'commerce-site-order-items',
    label: 'item',
    enableRowSelection: false,
    enableSorting: false,
  });

  return (
    <DataTable
      table={itemsTable}
      mode="tab"
      permission={SITE_ORDERS.view}
      emptyStateConfig={{
        icon: Package,
        title: 'No items',
        description: 'This order has no items.',
      }}
    />
  );
};
