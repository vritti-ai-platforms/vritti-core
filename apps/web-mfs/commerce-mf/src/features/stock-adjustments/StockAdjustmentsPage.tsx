import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ClipboardMinus, Eye, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { STOCK_ADJUSTMENTS_TABLE_KEY, useStockAdjustmentsTable } from '@/hooks/stock-adjustments';
import type { StockAdjustmentData, StockAdjustmentStatus, StockAdjustmentType } from '@/schemas/stock-adjustments';
import { CreateStockAdjustmentDialog } from './forms/CreateStockAdjustmentDialog';

const typeConfig: Record<
  StockAdjustmentType,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  OPENING_STOCK: { label: 'Opening Stock', variant: 'default' },
  WASTE: { label: 'Waste', variant: 'destructive' },
  DAMAGE: { label: 'Damage', variant: 'destructive' },
  THEFT: { label: 'Theft', variant: 'destructive' },
  EXPIRED: { label: 'Expired', variant: 'secondary' },
  CORRECTION: { label: 'Correction', variant: 'outline' },
  PRODUCTION: { label: 'Production', variant: 'secondary' },
};

const statusConfig: Record<StockAdjustmentStatus, { label: string; variant: 'outline' | 'default' }> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  PUBLISHED: { label: 'Published', variant: 'default' },
};

export const StockAdjustmentsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useStockAdjustmentsTable();
  const addDialog = useDialog();

  const columns = useMemo<ColumnDef<StockAdjustmentData>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => row.original.code,
      },
      {
        accessorKey: 'inventoryItemName',
        header: 'Inventory Item',
        cell: ({ row }) => row.original.inventoryItemName ?? '—',
        enableSorting: true,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const config = typeConfig[row.original.type];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const config = statusConfig[row.original.status];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => row.original.reason ?? '—',
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
                onClick: () => navigate(buildSlug(row.original.code, row.original.id)),
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
    slug: 'commerce-stock-adjustments',
    label: 'stock adjustment',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENTS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stock Adjustments"
        description="Record stock corrections, waste, damage, and other adjustments"
      />

      <DataTable
        table={table}
        isLoading={isLoading}
        searchConfig={{
          columns: [
            { id: 'inventoryItemName', label: 'Item' },
            { id: 'reason', label: 'Reason' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Add Adjustment
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: ClipboardMinus,
          title: 'No stock adjustments',
          description: 'Record your first stock adjustment to track inventory changes.',
          action: (
            <Button onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Add Adjustment
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="New Stock Adjustment"
        description="Create a draft stock adjustment. You can add lines after creation."
        content={(close) => (
          <CreateStockAdjustmentDialog
            onSuccess={(adjustment) => {
              close();
              navigate(buildSlug(adjustment.code, adjustment.id));
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
