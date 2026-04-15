import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { useConfirm, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageContent, PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { CheckCircle } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDeleteStockAdjustment,
  usePublishStockAdjustment,
  useStockAdjustment,
} from '@/hooks/stock-adjustments';
import type {
  StockAdjustmentStatus,
  StockAdjustmentType,
} from '@/schemas/stock-adjustments';
import { StockAdjustmentContent, StockAdjustmentOverviewCard, StockAdjustmentSidePanel } from './components';

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
  const confirm = useConfirm();
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const { data: adjustment } = useStockAdjustment(id ?? '');
  const deleteMutation = useDeleteStockAdjustment();
  const publishMutation = usePublishStockAdjustment();

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
              disabled={!adjustment.isPublishable}
            >
              Publish
            </Button>
          ) : (
            <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
          )
        }
      />

      <StockAdjustmentOverviewCard adjustment={adjustment} typeLabel={typeConf.label} typeVariant={typeConf.variant} />

      <PageContent>
        <StockAdjustmentSidePanel
          adjustmentId={adjustment.id}
          adjustmentType={adjustment.type}
          inventoryItemId={adjustment.inventoryItemId}
          selectedLineId={selectedLineId}
          isOpeningStock={isOpeningStock}
          isDraft={Boolean(isDraft)}
          onSelectLine={setSelectedLineId}
        />
        <PageContentDetails>
          <StockAdjustmentContent
            adjustment={adjustment}
            selectedLineId={selectedLineId}
            isDraft={Boolean(isDraft)}
            isOpeningStock={isOpeningStock}
          />
        </PageContentDetails>
      </PageContent>

      {isDraft && (
        <DangerZone
          title="Delete this draft adjustment"
          description="This action cannot be undone. The draft adjustment and all its lines will be permanently removed."
          buttonText="Delete Draft"
          onClick={handleDelete}
          isLoading={deleteMutation.isPending}
          disabled={deleteMutation.isPending}
        />
      )}
    </div>
  );
};
