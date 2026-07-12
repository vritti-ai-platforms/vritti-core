import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ClipboardMinus, Eye, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryTrackingConfig } from '@/schemas/inventory-items';
import {
  type StockAdjustmentData,
  stockAdjustmentStatusConfig,
  stockAdjustmentTypeConfig,
} from '@/schemas/stock-adjustments';
import { STOCK_ADJUSTMENTS_TABLE_KEY, useStockAdjustmentsTable } from '@/site/hooks/stock-adjustments';
import { CreateStockAdjustmentDialog } from './forms/CreateStockAdjustmentDialog';

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
        cell: ({ row }) => <StringCell value={row.original.inventoryItemName} />,
        enableSorting: true,
      },
      {
        accessorKey: 'inventoryItemTracking',
        header: 'Tracking',
        cell: ({ row }) => <StringCell value={inventoryTrackingConfig[row.original.inventoryItemTracking]?.label} />,
        enableSorting: false,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const config = stockAdjustmentTypeConfig[row.original.type];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const config = stockAdjustmentStatusConfig[row.original.status];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => <StringCell value={row.original.reason} />,
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
            { id: 'code', label: 'Code' },
            { id: 'inventoryItemName', label: 'Item' },
          ],
          searchAll: true,
        }}
        filters={[
          <SelectFilter
            key="type"
            name="type"
            label="Type"
            multiple
            options={Object.entries(stockAdjustmentTypeConfig).map(([value, { label }]) => ({ label, value }))}
          />,
          <SelectFilter
            key="status"
            name="status"
            label="Status"
            multiple
            options={Object.entries(stockAdjustmentStatusConfig).map(([value, { label }]) => ({ label, value }))}
          />,
        ]}
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
        icon={ClipboardMinus}
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
