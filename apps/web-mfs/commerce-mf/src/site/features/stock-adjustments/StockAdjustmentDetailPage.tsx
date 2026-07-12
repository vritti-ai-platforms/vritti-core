import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { CheckCircle, ClipboardMinus, Pencil } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type InventoryTracking,
  InventoryTrackingValues,
  type StockAdjustmentStatus,
  StockAdjustmentStatusValues,
  type StockAdjustmentType,
  StockAdjustmentTypeValues,
} from '@/schemas/stock-adjustments';
import {
  useDeleteStockAdjustment,
  usePublishStockAdjustment,
  useStockAdjustment,
} from '@/site/hooks/stock-adjustments';
import { EditStockAdjustmentDialog } from './forms/EditStockAdjustmentDialog';
import { BreakdownTab } from './tabs/BreakdownTab';
import { OverviewTab } from './tabs/OverviewTab';

function getPublishBlockedTip(type: StockAdjustmentType, tracking: InventoryTracking): string {
  if (type === StockAdjustmentTypeValues.OPENING_STOCK) {
    switch (tracking) {
      case InventoryTrackingValues.QUANTITY:
        return 'Add at least one line with a location and quantity before publishing.';
      case InventoryTrackingValues.LOT:
        return 'Add lots, assign a line with a location and quantity to each lot before publishing.';
      case InventoryTrackingValues.SERIAL:
        return 'Add lines and fill in all serial numbers before publishing.';
      case InventoryTrackingValues.LOT_SERIAL:
        return 'Add lots, assign lines to each lot, and fill in all serial numbers before publishing.';
    }
  }
  switch (tracking) {
    case InventoryTrackingValues.QUANTITY:
      return 'Add at least one line with a stock entry and quantity before publishing.';
    case InventoryTrackingValues.LOT:
      return 'Add at least one line with a lot entry selected before publishing.';
    case InventoryTrackingValues.SERIAL:
      return 'Select stock entries and fill in all serial numbers before publishing.';
    case InventoryTrackingValues.LOT_SERIAL:
      return 'Select lot entries and fill in all serial numbers before publishing.';
  }
}

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
  const [activeTab, setActiveTab] = useState('overview');

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
  const typeConf = typeConfig[adjustment.type];
  const statusConf = statusConfig[adjustment.status];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={adjustment.code}
        titleSlot={<Badge variant={statusConf.variant}>{statusConf.label}</Badge>}
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
                disabledTip={getPublishBlockedTip(adjustment.type, adjustment.inventoryItemTracking)}
              >
                Publish
              </Button>
            </div>
          ) : undefined
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: <OverviewTab adjustment={adjustment} typeLabel={typeConf.label} typeVariant={typeConf.variant} />,
          },
          {
            value: 'breakdown',
            label: 'Breakdown',
            content: <BreakdownTab adjustment={adjustment} isDraft={isDraft} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

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
        icon={ClipboardMinus}
        title="Edit Reason"
        description="Update the reason for this draft adjustment."
        content={(close) => (
          <EditStockAdjustmentDialog
            adjustmentId={adjustment.id}
            reason={adjustment.reason}
            type={adjustment.type}
            unitCost={adjustment.unitCost}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
