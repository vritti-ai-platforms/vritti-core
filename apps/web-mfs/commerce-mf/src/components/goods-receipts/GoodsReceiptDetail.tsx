import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { CheckCircle, Pencil, ReceiptText } from 'lucide-react';
import type React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { receiveWithInvoicePath } from '@/components/purchases/documentPaths';
import { PartOfPurchaseChips } from '@/components/purchases/PartOfPurchaseChips';
import { documentPurchases, purchaseLockTip } from '@/components/purchases/purchaseDocuments';
import { GoodsReceiptStatus } from '@/schemas/goods-receipts';
import { workspaceBase } from '@/utils/workspace';
import type { GoodsReceiptsBinding } from './bindings';
import { UpdateGoodsReceiptDialog } from './forms/UpdateGoodsReceiptDialog';
import { GoodsReceiptStatusBadge } from './GoodsReceiptStatusBadge';
import { BreakdownTab } from './tabs/breakdown/BreakdownTab';
import { ItemsCostTab } from './tabs/items-cost/ItemsCostTab';
import { OverviewTab } from './tabs/OverviewTab';

interface GoodsReceiptDetailProps {
  binding: GoodsReceiptsBinding;
}

// `…/goods-receipts/<number~id>` — a receipt of a purchase order's goods: what was counted per line, where it was put
// away and its provisional cost; a draft is counted, edited, posted or deleted — except a Receive with Invoice's, which
// its purchase edits, posts or discards, and a purchase's receipt is never deleted here
export const GoodsReceiptDetail: React.FC<GoodsReceiptDetailProps> = ({ binding }) => {
  const { permissions } = binding;
  const { id } = useSlugParams('grSlug');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const confirm = useConfirm();
  const { data: receipt } = binding.useGoodsReceipt(id);
  const { data: counts, isLoading: countsLoading } = binding.useGoodsReceiptCounts(id);
  const postMutation = binding.usePost(receipt.id);
  const deleteMutation = binding.useDelete();
  const editDialog = useDialog();
  const isDraft = receipt.status === GoodsReceiptStatus.DRAFT;
  // A Receive with Invoice's draft receipt is changed only on its Receive with Invoice
  const { receiveWithInvoiceInvoiceId } = receipt;
  const receiveWithInvoiceLock = receiveWithInvoiceInvoiceId
    ? 'Part of a Receive with Invoice — edit, post or discard it on the Receive with Invoice.'
    : undefined;
  const isEditableDraft = isDraft && !receiveWithInvoiceLock;
  const deleteLock = receipt.purchaseNumber ? purchaseLockTip(receipt.purchaseNumber) : undefined;

  // Confirms and posts the receipt into stock
  const handlePost = async () => {
    const confirmed = await confirm({
      title: `Post ${receipt.grNumber}?`,
      description: `The goods land in stock at their locations and the received quantities of ${receipt.poNumbers.join(', ')} move. The receipt can no longer be edited.`,
      confirmLabel: 'Post',
    });
    if (confirmed) postMutation.mutate();
  };

  // Confirms and deletes the draft, returning to the list; its inbound delivery stays
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete ${receipt.grNumber}?`,
      description: `${receipt.grNumber} and all its items, lots, lines and serials will be permanently removed. Inbound delivery ${receipt.deliveryNumber} stays open to receive again.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(receipt.id, { onSuccess: () => navigate('..') });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={receipt.grNumber}
        titleSlot={
          <div className="flex items-center gap-2">
            <GoodsReceiptStatusBadge status={receipt.status} />
            <PartOfPurchaseChips purchases={documentPurchases(receipt)} />
          </div>
        }
        description={receipt.siteName ? `${receipt.supplierName} · ${receipt.siteName}` : receipt.supplierName}
        actions={
          isDraft && (
            <div className="flex items-center gap-2">
              {receiveWithInvoiceInvoiceId && (
                <Button
                  size="sm"
                  variant="outline"
                  permission={permissions.view}
                  startAdornment={<ReceiptText className="size-4" />}
                  onClick={() =>
                    navigate(receiveWithInvoicePath(workspaceBase(pathname), { id: receiveWithInvoiceInvoiceId }))
                  }
                >
                  Open Receive with Invoice
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                permission={permissions.edit}
                startAdornment={<Pencil className="size-4" />}
                onClick={editDialog.open}
                disabled={!!receiveWithInvoiceLock}
                disabledTip={receiveWithInvoiceLock}
              >
                Edit
              </Button>
              <Button
                size="sm"
                permission={permissions.post}
                startAdornment={<CheckCircle className="size-4" />}
                onClick={handlePost}
                isLoading={postMutation.isPending}
                disabled={!receipt.isPostable || !!receiveWithInvoiceLock}
                disabledTip={
                  receiveWithInvoiceLock ??
                  "Count at least one item and distribute every item's accepted quantity to lines before posting."
                }
              >
                Post
              </Button>
            </div>
          )
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: permissions.view,
            content: <OverviewTab binding={binding} receipt={receipt} />,
          },
          {
            value: 'breakdown',
            label: 'Breakdown',
            count: counts?.itemCount,
            countLoading: countsLoading,
            permission: permissions.view,
            content: <BreakdownTab binding={binding} receipt={receipt} isDraft={isEditableDraft} />,
          },
          {
            value: 'items-cost',
            label: 'Items Cost',
            count: counts?.itemCount,
            countLoading: countsLoading,
            permission: permissions.view,
            content: <ItemsCostTab binding={binding} goodsReceiptId={receipt.id} isDraft={isDraft} />,
          },
        ]}
        defaultValue="overview"
      />

      <Dialog
        handle={editDialog}
        icon={Pencil}
        title={`Edit ${receipt.grNumber}`}
        description={`Change the receipt's notes. The supplier's delivery note is edited on inbound delivery ${receipt.deliveryNumber}.`}
        content={(close) => (
          <UpdateGoodsReceiptDialog
            useUpdate={binding.useUpdate}
            receipt={receipt}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      {isDraft && (
        <DangerZone
          title="Delete this draft"
          description="This action cannot be undone. The draft receipt and all its items, lots, lines, and serials will be permanently removed."
          buttonText="Delete Draft"
          permission={permissions.delete}
          onClick={handleDelete}
          isLoading={deleteMutation.isPending}
          disabled={!!deleteLock}
          warning={deleteLock}
          showWarning={!!deleteLock}
        />
      )}
    </div>
  );
};
