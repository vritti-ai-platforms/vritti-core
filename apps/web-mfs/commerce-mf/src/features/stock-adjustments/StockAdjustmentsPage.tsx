import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { ClipboardMinus, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useDeleteStockAdjustment } from '@/hooks/useDeleteStockAdjustment';
import { STOCK_ADJUSTMENTS_TABLE_KEY, useStockAdjustmentsTable } from '@/hooks/useStockAdjustmentsTable';
import type { StockAdjustmentData, StockAdjustmentType } from '@/schemas/stock-adjustments';
import { CreateStockAdjustmentDialog } from './forms/CreateStockAdjustmentDialog';

const typeConfig: Record<
  StockAdjustmentType,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' }
> = {
  OPENING_STOCK: { label: 'Opening Stock', variant: 'default' },
  WASTE: { label: 'Waste', variant: 'destructive' },
  DAMAGE: { label: 'Damage', variant: 'destructive' },
  THEFT: { label: 'Theft', variant: 'destructive' },
  EXPIRED: { label: 'Expired', variant: 'secondary' },
  CORRECTION: { label: 'Correction', variant: 'outline' },
  PRODUCTION: { label: 'Production', variant: 'secondary' },
};

export const StockAdjustmentsPage = () => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useStockAdjustmentsTable();
  const addDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeleteStockAdjustment();

  const handleDelete = useCallback(
    async (adjustment: StockAdjustmentData) => {
      const confirmed = await confirm({
        title: 'Delete this adjustment?',
        description: 'This stock adjustment will be permanently removed.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(adjustment.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<StockAdjustmentData>[]>(
    () => [
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
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => {
          const qty = row.original.quantity;
          const isPositive = qty > 0;
          return (
            <span className={`font-mono ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}
              {qty}
            </span>
          );
        },
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => row.original.reason ?? '—',
      },
      {
        accessorKey: 'adjustedBy',
        header: 'Adjusted By',
        cell: ({ row }) => row.original.adjustedBy ?? '—',
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
        cell: ({ row }) => {
          const isDeletable = row.original.type === 'OPENING_STOCK' || row.original.type === 'CORRECTION';
          return (
            <RowActions
              actions={[
                {
                  id: 'delete',
                  icon: Trash2,
                  label: 'Delete',
                  variant: 'destructive',
                  hidden: !isDeletable,
                  onClick: () => handleDelete(row.original),
                },
              ]}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete],
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
        title="Add Stock Adjustment"
        description="Record a stock adjustment for an inventory item."
        content={(close) => <CreateStockAdjustmentDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
