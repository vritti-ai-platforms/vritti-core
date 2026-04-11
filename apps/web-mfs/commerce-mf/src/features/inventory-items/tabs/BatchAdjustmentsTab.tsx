import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, useDataTable } from '@vritti/quantum-ui/DataTable';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { ClipboardMinus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { INVENTORY_ITEM_BATCH_ADJUSTMENTS_KEY, useInventoryItemBatchAdjustmentsTable } from '@/hooks/inventory-item-batches';
import { useDeleteStockAdjustment } from '@/hooks/useDeleteStockAdjustment';
import type { StockAdjustmentData, StockAdjustmentType } from '@/schemas/stock-adjustments';

interface BatchAdjustmentsTabProps {
  batchId: string;
}

const TYPE_CONFIG: Record<StockAdjustmentType, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' }> = {
  OPENING_STOCK: { label: 'Opening Stock', variant: 'default' },
  WASTE: { label: 'Waste', variant: 'destructive' },
  DAMAGE: { label: 'Damage', variant: 'destructive' },
  THEFT: { label: 'Theft', variant: 'destructive' },
  EXPIRED: { label: 'Expired', variant: 'secondary' },
  CORRECTION: { label: 'Correction', variant: 'outline' },
  PRODUCTION: { label: 'Production', variant: 'secondary' },
};

export const BatchAdjustmentsTab: React.FC<BatchAdjustmentsTabProps> = ({ batchId }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { data: response, isLoading } = useInventoryItemBatchAdjustmentsTable(batchId);
  const deleteMutation = useDeleteStockAdjustment();

  const handleDelete = async (adjustment: StockAdjustmentData) => {
    const confirmed = await confirm({
      title: 'Delete this adjustment?',
      description: 'This stock adjustment will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(adjustment.id);
  };

  const columns = useMemo<ColumnDef<StockAdjustmentData>[]>(
    () => [
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const config = TYPE_CONFIG[row.original.type];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => {
          const isPositive = row.original.quantity > 0;
          return (
            <span className={`font-mono ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}{row.original.quantity}
            </span>
          );
        },
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.reason ?? '—'}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>
        ),
        enableSorting: true,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const isDeletable = row.original.type === 'OPENING_STOCK' || row.original.type === 'CORRECTION';
          if (!isDeletable) return null;
          return (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(row.original)}
              aria-label="Delete adjustment"
            >
              <Trash2 className="size-4" />
            </Button>
          );
        },
      },
    ],
    [],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `inventory-batch-${batchId}-adjustments`,
    label: 'adjustment',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: [...INVENTORY_ITEM_BATCH_ADJUSTMENTS_KEY(batchId)] }),
  });

  return (
    <DataTable
      table={table}
      mode="compact"
      isLoading={isLoading}
      emptyStateConfig={{
        icon: ClipboardMinus,
        title: 'No adjustments',
        description: 'Stock adjustments applied to this batch will appear here.',
      }}
    />
  );
};
