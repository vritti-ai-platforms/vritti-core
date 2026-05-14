import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { FormattedDate } from '@vritti/quantum-ui/FormattedDate';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { SupplierFilter } from '@vritti/quantum-ui/selects/supplier';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ClipboardList, Eye, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PURCHASE_ORDERS_TABLE_KEY, usePurchaseOrdersTable } from '@/hooks/purchase-orders';
import type { PurchaseOrderData } from '@/schemas/purchase-orders';
import { purchaseOrderStatusConfig } from '@/schemas/purchase-orders';
import { CreatePurchaseOrderDialog } from './forms/CreatePurchaseOrderDialog';

export const PurchaseOrdersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = usePurchaseOrdersTable();
  const addDialog = useDialog();

  const columns = useMemo<ColumnDef<PurchaseOrderData>[]>(
    () => [
      {
        accessorKey: 'poNumber',
        header: 'PO Number',
        enableSorting: true,
      },
      {
        accessorKey: 'supplierName',
        header: 'Supplier',
        cell: ({ row }) => row.original.supplierName ?? '—',
        enableSorting: true,
      },
      {
        accessorKey: 'orderDate',
        header: 'Order Date',
        cell: ({ row }) => <FormattedDate value={row.original.orderDate} dateFormat="P" />,
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const config = purchaseOrderStatusConfig[row.original.status];
          return (
            <Badge variant={config.variant} className={config.className}>
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total',
        cell: ({ row }) =>
          row.original.totalAmount != null
            ? `${row.original.totalAmount.currency} ${row.original.totalAmount.value}`
            : '—',
        enableSorting: false,
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
                onClick: () => navigate(buildSlug(row.original.poNumber, row.original.id)),
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
    slug: 'commerce-purchase-orders',
    label: 'purchase order',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Purchase Orders" description="Create and manage purchase orders with your suppliers" />

      <DataTable
        table={table}
        isLoading={isLoading}
        searchConfig={{
          columns: [
            { id: 'poNumber', label: 'PO Number' },
            { id: 'supplierName', label: 'Supplier' },
          ],
          searchAll: true,
        }}
        filters={[
          <SelectFilter
            key="status"
            name="status"
            label="Status"
            multiple
            options={Object.entries(purchaseOrderStatusConfig).map(([value, { label }]) => ({ label, value }))}
          />,
          <SupplierFilter key="supplierId" />,
        ]}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              New Purchase Order
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: ClipboardList,
          title: 'No purchase orders',
          description: 'Create your first purchase order to start tracking procurement.',
          action: (
            <Button onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              New Purchase Order
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="New Purchase Order"
        description="Create a purchase order for a supplier."
        content={(close) => <CreatePurchaseOrderDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
