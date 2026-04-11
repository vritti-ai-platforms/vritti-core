import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ArrowRightLeft, Eye, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { STOCK_TRANSFERS_TABLE_KEY, useStockTransfersTable } from '@/hooks/useStockTransfersTable';
import type { StockTransferData, StockTransferStatus } from '@/schemas/stock-transfers';
import { CreateStockTransferDialog } from './forms/CreateStockTransferDialog';

const statusConfig: Record<
  StockTransferStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive'; className?: string }
> = {
  REQUESTED: { label: 'Requested', variant: 'outline' },
  IN_TRANSIT: { label: 'In Transit', variant: 'secondary', className: 'bg-warning/15 text-warning' },
  RECEIVED: { label: 'Received', variant: 'secondary', className: 'bg-success/15 text-success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export const StockTransfersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useStockTransfersTable();
  const addDialog = useDialog();

  const columns = useMemo<ColumnDef<StockTransferData>[]>(
    () => [
      {
        accessorKey: 'inventoryItemName',
        header: 'Inventory Item',
        cell: ({ row }) => row.original.inventoryItemName ?? '—',
        enableSorting: true,
      },
      {
        accessorKey: 'fromBuName',
        header: 'From',
        cell: ({ row }) => row.original.fromBuName ?? row.original.fromBuId,
      },
      {
        accessorKey: 'toBuName',
        header: 'To',
        cell: ({ row }) => row.original.toBuName ?? row.original.toBuId,
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => <span className="font-mono">{row.original.quantity}</span>,
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
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
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
                onClick: () => navigate(buildSlug(row.original.id.slice(0, 8), row.original.id)),
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
    slug: 'commerce-stock-transfers',
    label: 'stock transfer',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: STOCK_TRANSFERS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Stock Transfers" description="Transfer inventory between business units and locations" />

      <DataTable
        table={table}
        isLoading={isLoading}
        searchConfig={{
          columns: [{ id: 'inventoryItemName', label: 'Item' }],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Create Transfer
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: ArrowRightLeft,
          title: 'No stock transfers',
          description: 'Create your first stock transfer to move inventory between locations.',
          action: (
            <Button onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Create Transfer
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="Create Stock Transfer"
        description="Transfer inventory from one location to another."
        content={(close) => <CreateStockTransferDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
