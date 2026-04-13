import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { CheckCircle, ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  STOCK_ADJUSTMENT_LINES_TABLE_KEY,
  useDeleteStockAdjustment,
  usePublishStockAdjustment,
  useRemoveStockAdjustmentLine,
  useStockAdjustment,
  useStockAdjustmentLinesTable,
} from '@/hooks/stock-adjustments';
import type { StockAdjustmentLineData, StockAdjustmentStatus, StockAdjustmentType } from '@/schemas/stock-adjustments';
import { AddStockAdjustmentLineDialog } from './forms/AddStockAdjustmentLineDialog';

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

export const StockAdjustmentDetailPage = () => {
  const { id } = useSlugParams('adjustmentSlug');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addLineDialog = useDialog();

  const { data: adjustment, isLoading } = useStockAdjustment(id ?? null);
  const { data: linesResponse, isLoading: isLoadingLines } = useStockAdjustmentLinesTable(id ?? null);
  const deleteMutation = useDeleteStockAdjustment();
  const publishMutation = usePublishStockAdjustment();
  const removeLineMutation = useRemoveStockAdjustmentLine(id ?? '');

  const isDraft = adjustment?.status === 'DRAFT';
  const isOpeningStock = adjustment?.type === 'OPENING_STOCK';

  const handlePublish = useCallback(async () => {
    if (!id) return;
    const confirmed = await confirm({
      title: 'Publish this adjustment?',
      description:
        'Publishing will atomically create/adjust batches and write ledger entries. This action cannot be undone.',
      confirmLabel: 'Publish',
    });
    if (confirmed) publishMutation.mutate(id);
  }, [id, confirm, publishMutation]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    const confirmed = await confirm({
      title: 'Delete this draft?',
      description: 'This draft adjustment and all its lines will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(id, { onSuccess: () => navigate('..') });
    }
  }, [id, confirm, deleteMutation, navigate]);

  const handleRemoveLine = useCallback(
    async (lineId: string) => {
      const confirmed = await confirm({
        title: 'Remove this line?',
        description: 'This batch line will be removed from the adjustment.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeLineMutation.mutate(lineId);
    },
    [confirm, removeLineMutation],
  );

  const columns = useMemo<ColumnDef<StockAdjustmentLineData>[]>(
    () => [
      {
        accessorKey: isOpeningStock ? 'locationName' : 'batchNumber',
        header: isOpeningStock ? 'Location' : 'Batch',
        cell: ({ row }) =>
          isOpeningStock
            ? (row.original.locationName ?? '—')
            : row.original.batchNumber
              ? `Batch #${row.original.batchNumber}`
              : '—',
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => {
          const qty = row.original.quantity;
          return (
            <span className={`font-mono ${qty > 0 ? 'text-success' : 'text-destructive'}`}>
              {qty > 0 ? '+' : ''}
              {qty}
            </span>
          );
        },
      },
      ...(isOpeningStock
        ? [
            {
              accessorKey: 'manufacturingDate' as const,
              header: 'Mfg Date',
              cell: ({ row }: { row: { original: StockAdjustmentLineData } }) =>
                row.original.manufacturingDate ? new Date(row.original.manufacturingDate).toLocaleDateString() : '—',
            },
            {
              accessorKey: 'expiryDate' as const,
              header: 'Expiry Date',
              cell: ({ row }: { row: { original: StockAdjustmentLineData } }) =>
                row.original.expiryDate ? new Date(row.original.expiryDate).toLocaleDateString() : '—',
            },
          ]
        : []),
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      ...(isDraft
        ? [
            {
              id: 'actions' as const,
              header: '',
              cell: ({ row }: { row: { original: StockAdjustmentLineData } }) => (
                <RowActions
                  actions={[
                    {
                      id: 'delete',
                      icon: Trash2,
                      label: 'Remove',
                      variant: 'destructive' as const,
                      onClick: () => handleRemoveLine(row.original.id),
                    },
                  ]}
                />
              ),
              enableSorting: false,
              enableHiding: false,
            },
          ]
        : []),
    ],
    [isOpeningStock, isDraft, handleRemoveLine],
  );

  const { table } = useDataTable({
    columns,
    serverState: linesResponse,
    slug: id ? `stock-adjustment-${id}-lines` : '',
    label: 'batch line',
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => {
      if (id) queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_TABLE_KEY(id) });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!adjustment) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">Stock adjustment not found.</div>
    );
  }

  const typeConf = typeConfig[adjustment.type];
  const statusConf = statusConfig[adjustment.status];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={adjustment.code}
        description={`${typeConf.label} — ${adjustment.inventoryItemName ?? 'Stock Adjustment'}`}
        actions={
          isDraft ? (
            <Button
              size="sm"
              startAdornment={<CheckCircle className="size-4" />}
              onClick={handlePublish}
              isLoading={publishMutation.isPending}
              disabled={(linesResponse?.count ?? 0) === 0}
            >
              Publish
            </Button>
          ) : (
            <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
          )
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-6">
            <div>
              <dt className="text-sm text-muted-foreground">Inventory Item</dt>
              <dd className="mt-1 font-medium">{adjustment.inventoryItemName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Type</dt>
              <dd className="mt-1">
                <Badge variant={typeConf.variant}>{typeConf.label}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Reason</dt>
              <dd className="mt-1">{adjustment.reason ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Created</dt>
              <dd className="mt-1">{new Date(adjustment.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Published</dt>
              <dd className="mt-1">
                {adjustment.publishedAt ? new Date(adjustment.publishedAt).toLocaleDateString() : '—'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <DataTable
        table={table}
        mode="compact"
        isLoading={isLoadingLines}
        toolbarActions={
          isDraft
            ? {
                actions: (
                  <Button size="sm" onClick={addLineDialog.open}>
                    <Plus className="mr-2 size-4" />
                    Add Batch Line
                  </Button>
                ),
              }
            : undefined
        }
        emptyStateConfig={{
          icon: ClipboardList,
          title: 'No batch lines',
          description: isDraft
            ? 'Add batch lines to this adjustment before publishing.'
            : 'This adjustment has no batch lines.',
          action: isDraft ? (
            <Button onClick={addLineDialog.open}>
              <Plus className="mr-2 size-4" />
              Add Batch Line
            </Button>
          ) : undefined,
        }}
      />

      <Dialog
        handle={addLineDialog}
        title="Add Batch Line"
        description={
          isOpeningStock
            ? 'Add a new opening stock entry with location and quantity.'
            : 'Select a batch and specify the adjustment quantity.'
        }
        content={(close) => (
          <AddStockAdjustmentLineDialog
            adjustmentId={adjustment.id}
            adjustmentType={adjustment.type}
            inventoryItemId={adjustment.inventoryItemId}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      {isDraft && (
        <DangerZone
          title="Delete this draft adjustment"
          description="This action cannot be undone. The draft adjustment and all its batch lines will be permanently removed."
          buttonText="Delete Draft"
          onClick={handleDelete}
        />
      )}
    </div>
  );
};
