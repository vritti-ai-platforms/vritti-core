import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageContent } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { CheckCircle, Link2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteGoodsReceipt, useGoodsReceipt, usePublishGoodsReceipt } from '@/hooks/goods-receipts';
import { GoodsReceiptStatus, goodsReceiptStatusLabels } from '@/schemas/goods-receipts';
import { GoodsReceiptOverviewCard } from './components/GoodsReceiptOverviewCard';
import { GoodsReceiptTreePanel, type TreeSelection } from './components/GoodsReceiptTreePanel';
import { RightContent } from './components/RightContent';
import { LinkPurchaseOrderDialog } from './forms/LinkPurchaseOrderDialog';

export const GoodsReceiptDetailPage = () => {
  const { id } = useSlugParams('grSlug');
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data: receipt } = useGoodsReceipt(id);
  const publishMutation = usePublishGoodsReceipt(receipt.id);
  const deleteMutation = useDeleteGoodsReceipt();
  const linkPoDialog = useDialog();
  const [selection, setSelection] = useState<TreeSelection | null>(null);

  const isDraft = receipt.status === GoodsReceiptStatus.DRAFT;
  const canPublish = isDraft && !!receipt.isPublishable;
  const canLinkPo = !!receipt.canLinkPurchaseOrder;

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

      <Dialog
        handle={linkPoDialog}
        title="Link Purchase Order"
        description={`Attach a confirmed PO from ${receipt.supplierName} to this goods receipt.`}
        content={(close) => (
          <LinkPurchaseOrderDialog goodsReceipt={receipt} onSuccess={close} onCancel={close} />
        )}
      />

      <GoodsReceiptOverviewCard id={id} />

      <PageContent>
        <GoodsReceiptTreePanel
          goodsReceiptId={receipt.id}
          isDraft={isDraft}
          poId={receipt.po?.id ?? null}
          supplierId={receipt.supplierId}
          selection={selection}
          onSelect={setSelection}
        />
        <RightContent
          goodsReceiptId={receipt.id}
          isDraft={isDraft}
          selection={selection}
          onSelectionChange={setSelection}
        />
      </PageContent>

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
    </div>
  );
};
