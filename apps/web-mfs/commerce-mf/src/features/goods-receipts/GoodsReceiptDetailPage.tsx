import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { CheckCircle, Link2, Unlink } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDeleteGoodsReceipt,
  useGoodsReceipt,
  useGoodsReceiptInventoryItemIds,
  usePublishGoodsReceipt,
  useUnlinkGoodsReceiptPurchaseOrder,
} from '@/hooks/goods-receipts';
import { GoodsReceiptStatus, goodsReceiptStatusLabels } from '@/schemas/goods-receipts';
import { LinkPurchaseOrderDialog } from './forms/LinkPurchaseOrderDialog';
import { BreakdownTab } from './tabs/BreakdownTab';
import { ItemsCostTab } from './tabs/ItemsCostTab';
import { OverviewTab } from './tabs/OverviewTab';

export const GoodsReceiptDetailPage = () => {
  const { id } = useSlugParams('grSlug');
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data: receipt } = useGoodsReceipt(id);
  const { data: existingInventoryItemIds = [] } = useGoodsReceiptInventoryItemIds(receipt.id);
  const publishMutation = usePublishGoodsReceipt(receipt.id);
  const deleteMutation = useDeleteGoodsReceipt();
  const unlinkPoMutation = useUnlinkGoodsReceiptPurchaseOrder(receipt.id);
  const linkPoDialog = useDialog();
  const [activeTab, setActiveTab] = useState('overview');

  const isDraft = receipt.status === GoodsReceiptStatus.DRAFT;
  const canPublish = isDraft && !!receipt.isPublishable;
  const canLinkPo = !!receipt.canLinkPurchaseOrder;
  const canUnlinkPo = !!receipt.canUnlinkPurchaseOrder;

  const handlePublish = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Publish this goods receipt?',
      description: 'Publishing creates inventory entries and locks the receipt from further editing.',
      confirmLabel: 'Publish',
    });
    if (confirmed) publishMutation.mutate();
  }, [confirm, publishMutation]);

  const handleDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Delete this draft?',
      description: 'This goods receipt and all its items, lots, lines, and serials will be removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(receipt.id, { onSuccess: () => navigate('..') });
  }, [confirm, deleteMutation, navigate, receipt.id]);

  const handleUnlinkPo = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Unlink purchase order?',
      description: 'The PO link will be removed. You can link a different PO afterwards.',
      confirmLabel: 'Unlink',
    });
    if (confirmed) unlinkPoMutation.mutate();
  }, [confirm, unlinkPoMutation]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={receipt.grNumber}
        titleSlot={<Badge variant="outline">{goodsReceiptStatusLabels[receipt.status] ?? receipt.status}</Badge>}
        description={receipt.supplierName ?? undefined}
        actions={
          isDraft ? (
            <div className="flex gap-2">
              {canLinkPo && (
                <Button variant="outline" startAdornment={<Link2 className="size-4" />} onClick={linkPoDialog.open}>
                  Link PO
                </Button>
              )}
              {canUnlinkPo && (
                <Button
                  variant="outline"
                  startAdornment={<Unlink className="size-4" />}
                  onClick={handleUnlinkPo}
                  isLoading={unlinkPoMutation.isPending}
                >
                  Unlink PO
                </Button>
              )}
              <Button
                startAdornment={<CheckCircle className="size-4" />}
                onClick={handlePublish}
                isLoading={publishMutation.isPending}
                disabled={!canPublish}
                disabledTip="Add items, balance lines, and stay within PO caps before publishing."
              >
                Publish
              </Button>
            </div>
          ) : null
        }
      />

      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview', content: <OverviewTab receipt={receipt} /> },
          {
            value: 'breakdown',
            label: `Breakdown (${existingInventoryItemIds.length})`,
            content: <BreakdownTab receipt={receipt} isDraft={isDraft} />,
          },
          {
            value: 'items-cost',
            label: 'Items Cost',
            content: <ItemsCostTab goodsReceiptId={receipt.id} isDraft={isDraft} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      {isDraft && (
        <DangerZone
          title="Delete this draft"
          description="This action cannot be undone. The draft receipt and all its items, lots, lines, and serials will be permanently removed."
          buttonText="Delete Draft"
          onClick={handleDelete}
          isLoading={deleteMutation.isPending}
          disabled={deleteMutation.isPending}
        />
      )}

      <Dialog
        handle={linkPoDialog}
        title="Link Purchase Order"
        description={`Attach a confirmed PO from ${receipt.supplierName} to this goods receipt.`}
        content={(close) => (
          <LinkPurchaseOrderDialog goodsReceipt={receipt} onSuccess={close} onCancel={close} />
        )}
      />
    </div>
  );
};
