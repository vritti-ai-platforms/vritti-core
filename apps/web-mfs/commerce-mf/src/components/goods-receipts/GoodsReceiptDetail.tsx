import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { CheckCircle, Pencil } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoodsReceiptStatus } from '@/schemas/goods-receipts';
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
// away and its provisional cost; a draft is counted, edited, published or deleted
export const GoodsReceiptDetail: React.FC<GoodsReceiptDetailProps> = ({ binding }) => {
  const { permissions } = binding;
  const { id } = useSlugParams('grSlug');
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data: receipt } = binding.useGoodsReceipt(id);
  const publishMutation = binding.usePublish(receipt.id);
  const deleteMutation = binding.useDelete();
  const editDialog = useDialog();
  const isDraft = receipt.status === GoodsReceiptStatus.DRAFT;

  // Confirms and publishes the receipt into stock
  const handlePublish = async () => {
    const confirmed = await confirm({
      title: `Publish ${receipt.grNumber}?`,
      description: `The goods land in stock at their locations and the received quantities of ${receipt.poNumbers.join(', ')} move. The receipt can no longer be edited.`,
      confirmLabel: 'Publish',
    });
    if (confirmed) publishMutation.mutate();
  };

  // Confirms and deletes the draft with the inbound delivery it created, returning to the list
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete ${receipt.grNumber}?`,
      description:
        receipt.deliverySource === 'RECEIPT'
          ? `${receipt.grNumber} and all its items, lots, lines and serials will be permanently removed, together with inbound delivery ${receipt.deliveryNumber} it created.`
          : `${receipt.grNumber} and all its items, lots, lines and serials will be permanently removed. Inbound delivery ${receipt.deliveryNumber} stays open to receive again.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(receipt.id, { onSuccess: () => navigate('..') });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={receipt.grNumber}
        titleSlot={<GoodsReceiptStatusBadge status={receipt.status} />}
        description={receipt.siteName ? `${receipt.supplierName} · ${receipt.siteName}` : receipt.supplierName}
        actions={
          isDraft && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                permission={permissions.edit}
                startAdornment={<Pencil className="size-4" />}
                onClick={editDialog.open}
              >
                Edit
              </Button>
              <Button
                size="sm"
                permission={permissions.publish}
                startAdornment={<CheckCircle className="size-4" />}
                onClick={handlePublish}
                isLoading={publishMutation.isPending}
                disabled={!receipt.isPublishable}
                disabledTip="Count at least one item and distribute every item's accepted quantity to lines before publishing."
              >
                Publish
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
            label: `Breakdown (${receipt.itemCount})`,
            permission: permissions.view,
            content: <BreakdownTab binding={binding} receipt={receipt} isDraft={isDraft} />,
          },
          {
            value: 'items-cost',
            label: 'Items Cost',
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
        description={
          receipt.deliverySource === 'RECEIPT'
            ? "Change the receipt's notes and the supplier's delivery note on the delivery it created."
            : `Change the receipt's notes. The supplier's delivery note is edited on inbound delivery ${receipt.deliveryNumber}.`
        }
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
        />
      )}
    </div>
  );
};
