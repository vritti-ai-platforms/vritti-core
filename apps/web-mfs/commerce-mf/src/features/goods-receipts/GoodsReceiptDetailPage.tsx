import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { useConfirm, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoodsReceipt } from '@/hooks/goods-receipts/useGoodsReceipt';
import { useGoodsReceiptInventoryItemIds } from '@/hooks/goods-receipts/useGoodsReceiptLineIds';
import { GoodsReceiptStatus, goodsReceiptStatusLabels } from '@/schemas/goods-receipts';
import {
  useDeleteGoodsReceipt,
  usePublishGoodsReceipt,
  useStartGoodsReceiptAllocation,
} from '@/hooks/goods-receipts/useGoodsReceiptMutations';
import { ItemsTab } from './tabs/ItemsTab';
import { OverviewTab } from './tabs/OverviewTab';


export const GoodsReceiptDetailPage = () => {
  const { id } = useSlugParams('grSlug');
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data: receipt } = useGoodsReceipt(id);
  const { data: inventoryItemIds = [] } = useGoodsReceiptInventoryItemIds(id);
  const publishMutation = usePublishGoodsReceipt();
  const startAllocationMutation = useStartGoodsReceiptAllocation();
  const deleteMutation = useDeleteGoodsReceipt();
  const [activeTab, setActiveTab] = useState('overview');

  const isDraft = receipt.status === GoodsReceiptStatus.DRAFT;
  const isAllocationPending = receipt.status === GoodsReceiptStatus.ALLOCATION_PENDING;
  const canPublish = isAllocationPending && receipt.isPublishable;
  const lineCount = inventoryItemIds.length;

  const handleStartAllocation = async () => {
    const confirmed = await confirm({
      title: 'Move to batch allocation?',
      description: 'You will stop editing line quantities and move to batch and item allocation.',
      confirmLabel: 'Start Allocation',
    });
    if (confirmed) startAllocationMutation.mutate(receipt.id);
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete this goods receipt?',
      description: 'This will permanently delete the receipt and all its lines.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(receipt.id, { onSuccess: () => navigate('..') });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={receipt.grNumber}
        titleSlot={<Badge variant="outline">{goodsReceiptStatusLabels[receipt.status] ?? receipt.status}</Badge>}
        description={receipt.supplierName ?? undefined}
        actions={
          isDraft ? (
            <Button
              onClick={handleStartAllocation}
              isLoading={startAllocationMutation.isPending}
              disabled={lineCount === 0}
              disabledTip="Add at least one line item before starting allocation."
            >
              Start Allocation
            </Button>
          ) : isAllocationPending ? (
            <Button
              onClick={async () => {
                const confirmed = await confirm({
                  title: 'Publish this goods receipt?',
                  description: 'Publishing will apply inventory updates and lock this receipt from further editing.',
                  alert: {
                    type: 'warning',
                    text: 'You cannot add any line items after this action.',
                  },
                  confirmLabel: 'Publish',
                });
                if (confirmed) publishMutation.mutate(receipt.id);
              }}
              isLoading={publishMutation.isPending}
              disabled={!canPublish}
              disabledTip="Complete batch allocation and balancing before publishing."
            >
              Publish
            </Button>
          ) : null
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: <OverviewTab id={id} />,
          },
          {
            value: 'items',
            label: lineCount > 0 ? `Items (${lineCount})` : 'Items',
            content: <ItemsTab id={id} receipt={receipt} existingInventoryItemIds={inventoryItemIds} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

{(isDraft || isAllocationPending) && (
        <DangerZone
          title="Delete Goods Receipt"
          description="Permanently delete this receipt and all its lines. This cannot be undone."
          buttonText="Delete"
          isLoading={deleteMutation.isPending}
          disabled={deleteMutation.isPending}
          onClick={handleDelete}
        />
      )}
    </div>
  );
};
