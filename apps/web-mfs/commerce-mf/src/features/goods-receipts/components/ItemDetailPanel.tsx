import { Button } from '@vritti/quantum-ui/Button';
import { DetailField, DetailSection } from '@vritti/quantum-ui/DetailField';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Pencil, Trash2 } from 'lucide-react';
import { useGoodsReceiptItem, useRemoveGoodsReceiptItem } from '@/hooks/goods-receipts';
import { type GoodsReceiptItemData, InventoryTrackingValues } from '@/schemas/goods-receipts';
import { EditItemDialog } from '../forms/EditItemDialog';
import { GoodsReceiptDetailSkeleton } from './GoodsReceiptDetailSkeleton';
import type { TreeSelection } from './GoodsReceiptTreePanel';
import { LinesTable } from './LinesTable';
import { LotsTable } from './LotsTable';

interface ItemDetailPanelProps {
  goodsReceiptId: string;
  isDraft: boolean;
  selection: Extract<TreeSelection, { kind: 'item' }>;
  onSelectionChange: (selection: TreeSelection | null) => void;
}

export const ItemDetailPanel = ({ goodsReceiptId, isDraft, selection, onSelectionChange }: ItemDetailPanelProps) => {
  const { data: item, isLoading } = useGoodsReceiptItem(goodsReceiptId, selection.itemId);

  return (
    <PageContentDetails isLoading={isLoading || !item} loadingContent={<GoodsReceiptDetailSkeleton />}>
      {item ? (
        <ItemDetailContent
          goodsReceiptId={goodsReceiptId}
          isDraft={isDraft}
          selection={selection}
          onSelectionChange={onSelectionChange}
          item={item}
        />
      ) : null}
    </PageContentDetails>
  );
};

const ItemDetailContent = ({
  goodsReceiptId,
  isDraft,
  selection,
  onSelectionChange,
  item,
}: ItemDetailPanelProps & { item: GoodsReceiptItemData }) => {
  const confirm = useConfirm();
  const editItemDialog = useDialog();
  const removeItemMutation = useRemoveGoodsReceiptItem(goodsReceiptId, { onSuccess: () => onSelectionChange(null) });

  const tracking = item.inventoryItemTracking;
  const uomSymbol = item.inventoryItemUomSymbol;
  const allowDecimal = item.inventoryItemAllowDecimal;
  // How much of the total received quantity is still undistributed — the cap for adding/editing lines.
  const remainingToDistribute = Math.max(item.totalQty - item.acceptedQuantity, 0);

  // Quantity/serial items are received directly into location lines; lot/lot_serial items break down
  // into lots first.
  const usesLines = tracking === InventoryTrackingValues.QUANTITY || tracking === InventoryTrackingValues.SERIAL;

  const handleRemoveItem = async () => {
    const confirmed = await confirm({
      title: `Remove ${item.inventoryItemName}?`,
      description: 'This item and all its lots, lines, and serials will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeItemMutation.mutate(item.id);
  };

  return (
    <div className="space-y-4">
      <ItemHeader
        item={item}
        uomSymbol={uomSymbol}
        isDraft={isDraft}
        onEdit={editItemDialog.open}
        onRemove={handleRemoveItem}
        isRemovePending={removeItemMutation.isPending}
      />

      {usesLines ? (
        <LinesTable
          goodsReceiptId={goodsReceiptId}
          scope={{ kind: 'item', itemId: selection.itemId, inventoryItemId: item.inventoryItemId }}
          tracking={tracking}
          isDraft={isDraft}
          uomSymbol={uomSymbol}
          allowDecimal={allowDecimal}
          poRemainingQuantity={remainingToDistribute}
          onSelectLine={
            tracking === InventoryTrackingValues.SERIAL
              ? (lineId) =>
                  onSelectionChange(
                    lineId
                      ? { kind: 'line', itemId: selection.itemId, lotId: null, lineId }
                      : { kind: 'item', itemId: selection.itemId },
                  )
              : undefined
          }
        />
      ) : (
        <LotsTable
          goodsReceiptId={goodsReceiptId}
          itemId={selection.itemId}
          isDraft={isDraft}
          uomSymbol={uomSymbol}
          onSelectLot={(lotId) => onSelectionChange({ kind: 'lot', itemId: selection.itemId, lotId })}
        />
      )}

      <EditItemDialog goodsReceiptId={goodsReceiptId} item={item} handle={editItemDialog} />
    </div>
  );
};

interface ItemHeaderProps {
  item: GoodsReceiptItemData;
  uomSymbol: string;
  isDraft: boolean;
  onEdit: () => void;
  onRemove: () => void;
  isRemovePending: boolean;
}

const ItemHeader = ({ item, uomSymbol, isDraft, onEdit, onRemove, isRemovePending }: ItemHeaderProps) => (
  <div className="space-y-6">
    <div className="flex items-start justify-between gap-4">
      <h3 className="text-xl font-semibold">{item.inventoryItemName}</h3>
      {isDraft && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" startAdornment={<Pencil className="size-3.5" />} onClick={onEdit}>
            Edit Item
          </Button>
          <Button
            size="sm"
            variant="destructive"
            startAdornment={<Trash2 className="size-3.5" />}
            onClick={onRemove}
            isLoading={isRemovePending}
          >
            Remove Item
          </Button>
        </div>
      )}
    </div>
    <div className="flex flex-nowrap items-start gap-2 overflow-x-auto">
      <DetailSection wrap>
        <DetailField
          className="px-4 py-2"
          label="Ordered"
          type="string"
          mono
          value={`${item.orderedQty} ${uomSymbol}`}
        />
        <DetailField className="px-4 py-2" label="Free" type="string" mono value={`${item.freeQty} ${uomSymbol}`} />
        <DetailField className="px-4 py-2" label="Total" type="string" mono value={`${item.totalQty} ${uomSymbol}`} />
        <DetailField
          className="px-4 py-2"
          label="Distributed"
          type="string"
          mono
          value={`${item.acceptedQuantity} ${uomSymbol}`}
        />
        <DetailField
          className="px-4 py-2"
          label="Damaged"
          type="string"
          mono
          value={`${item.rejectedQuantity} ${uomSymbol}`}
        />
      </DetailSection>
      {item.poOrderedQuantity != null && (
        <DetailSection wrap>
          <DetailField
            className="px-4 py-2"
            label="PO Ordered"
            type="string"
            mono
            value={`${item.poOrderedQuantity} ${uomSymbol}`}
          />
          <DetailField
            className="px-4 py-2"
            label="PO Received"
            type="string"
            mono
            value={`${item.poReceivedQuantity ?? 0} ${uomSymbol}`}
          />
          <DetailField
            className="px-4 py-2"
            label="PO Remaining"
            type="string"
            mono
            value={`${item.poRemainingQuantity ?? 0} ${uomSymbol}`}
          />
        </DetailSection>
      )}
    </div>
  </div>
);
