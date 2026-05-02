import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { CheckCircle, Pencil } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteStockAdjustment, usePublishStockAdjustment, useStockAdjustment } from '@/hooks/stock-adjustments';
import {
  InventoryTrackingValues,
  type StockAdjustmentStatus,
  StockAdjustmentStatusValues,
  type StockAdjustmentType,
  StockAdjustmentTypeValues,
} from '@/schemas/stock-adjustments';
import { StockAdjustmentOverviewCard } from './components';
import { ChangeContent } from './components/change/ChangeContent';
import { ChangeItemContent } from './components/change/ChangeItemContent';
import { OpeningItemContent } from './components/opening/OpeningItemContent';
import { OpeningLotContent } from './components/opening/OpeningLotContent';
import { OpeningNoneContent } from './components/opening/OpeningNoneContent';
import { OpeningSerialContent } from './components/opening/OpeningSerialContent';
import { EditStockAdjustmentDialog } from './forms/EditStockAdjustmentDialog';

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
};

const statusConfig: Record<StockAdjustmentStatus, { label: string; variant: 'outline' | 'default' }> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  PUBLISHED: { label: 'Published', variant: 'default' },
};

export const StockAdjustmentDetailPage = () => {
  const { id } = useSlugParams('adjustmentSlug');
  const navigate = useNavigate();
  const confirm = useConfirm();
  const editAdjustmentDialog = useDialog();

  const { data: adjustment } = useStockAdjustment(id);
  const deleteMutation = useDeleteStockAdjustment();
  const publishMutation = usePublishStockAdjustment();

  const handlePublish = useCallback(async () => {
    if (!id) return;
    const confirmed = await confirm({
      title: 'Publish this adjustment?',
      description: 'Publishing will atomically create/adjust quants and write ledger entries.',
      confirmLabel: 'Publish',
    });
    if (confirmed) publishMutation.mutate(id);
  }, [id, confirm, publishMutation]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    const confirmed = await confirm({
      title: 'Delete this draft?',
      description: 'This draft adjustment and all its lots, lines and serials will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(id, { onSuccess: () => navigate('..') });
    }
  }, [id, confirm, deleteMutation, navigate]);

  const isDraft = adjustment.status === StockAdjustmentStatusValues.DRAFT;
  const isOpeningStock = adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK;
  const tracking = adjustment.inventoryItemTracking;

  const typeConf = typeConfig[adjustment.type];
  const statusConf = statusConfig[adjustment.status];

  const renderVariant = () => {
    if (isOpeningStock) {
      if (tracking === InventoryTrackingValues.QUANTITY)
        return <OpeningNoneContent adjustment={adjustment} isDraft={isDraft} />;
      if (tracking === InventoryTrackingValues.LOT)
        return <OpeningLotContent adjustment={adjustment} isDraft={isDraft} />;
      if (tracking === InventoryTrackingValues.SERIAL)
        return <OpeningSerialContent adjustment={adjustment} isDraft={isDraft} />;
      return <OpeningItemContent adjustment={adjustment} isDraft={isDraft} />;
    }
    if (tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL)
      return <ChangeItemContent adjustment={adjustment} isDraft={isDraft} />;
    return <ChangeContent adjustment={adjustment} isDraft={isDraft} tracking={tracking} />;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={adjustment.code}
        description={`${typeConf.label} — ${adjustment.inventoryItemName}`}
        actions={
          isDraft ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                startAdornment={<Pencil className="size-4" />}
                onClick={editAdjustmentDialog.open}
              >
                Edit Reason
              </Button>
              <Button
                size="sm"
                startAdornment={<CheckCircle className="size-4" />}
                onClick={handlePublish}
                isLoading={publishMutation.isPending}
                disabled={!adjustment.isPublishable}
              >
                Publish
              </Button>
            </div>
          ) : (
            <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
          )
        }
      />

      <StockAdjustmentOverviewCard adjustment={adjustment} typeLabel={typeConf.label} typeVariant={typeConf.variant} />
      {renderVariant()}
      {isDraft && (
        <DangerZone
          title="Delete this draft adjustment"
          description="This action cannot be undone. The draft adjustment and all its lots, lines, and serials will be permanently removed."
          buttonText="Delete Draft"
          onClick={handleDelete}
          isLoading={deleteMutation.isPending}
          disabled={deleteMutation.isPending}
        />
      )}

      <Dialog
        handle={editAdjustmentDialog}
        title="Edit Reason"
        description="Update the reason for this draft adjustment."
        content={(close) => (
          <EditStockAdjustmentDialog
            adjustmentId={adjustment.id}
            reason={adjustment.reason}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
