import { Button } from '@vritti/quantum-ui/Button';
import { DetailField, DetailHeader, DetailSection } from '@vritti/quantum-ui/DetailField';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Pencil, Trash2 } from 'lucide-react';
import type React from 'react';
import type { GoodsReceiptItemData } from '@/schemas/goods-receipts';
import { InventoryTrackingValues } from '@/schemas/inventory-items';
import type { GoodsReceiptsBinding } from '../../bindings';
import type { TreeSelection } from '../../types';
import { BreakdownDetailSkeleton } from './BreakdownDetailSkeleton';
import { EditItemDialog } from './forms/EditItemDialog';
import { GoodsReceiptItemFlags } from './GoodsReceiptItemFlags';
import { LinesTable } from './LinesTable';
import { LotsTable } from './LotsTable';

interface ItemDetailPanelProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  isDraft: boolean;
  selection: Extract<TreeSelection, { kind: 'item' }>;
  onSelectionChange: (selection: TreeSelection | null) => void;
}

// A picked item: its counts against the purchase order line, its flags, and its lots or lines
export const ItemDetailPanel: React.FC<ItemDetailPanelProps> = (props) => {
  const { data: item, isLoading } = props.binding.useItem(props.goodsReceiptId, props.selection.itemId);

  return (
    <PageContentDetails isLoading={isLoading || !item} loadingContent={<BreakdownDetailSkeleton />}>
      {item && <ItemDetailContent {...props} item={item} />}
    </PageContentDetails>
  );
};

// The item's header, flags and the table its accepted quantity is distributed in
const ItemDetailContent: React.FC<ItemDetailPanelProps & { item: GoodsReceiptItemData }> = ({
  binding,
  goodsReceiptId,
  isDraft,
  selection,
  onSelectionChange,
  item,
}) => {
  const confirm = useConfirm();
  const editItemDialog = useDialog();
  const removeItemMutation = binding.useRemoveItem(goodsReceiptId, { onSuccess: () => onSelectionChange(null) });
  const tracking = item.inventoryItemTracking;
  const undistributedQty = Math.max(item.acceptedQty - item.distributedQty, 0);
  // Quantity and serial items are put away straight into lines; lot-tracked items break into lots first
  const usesLines = tracking === InventoryTrackingValues.QUANTITY || tracking === InventoryTrackingValues.SERIAL;

  // Confirms and removes the item with everything counted under it
  const handleRemoveItem = async () => {
    const confirmed = await confirm({
      title: `Remove ${item.inventoryItemName}?`,
      description: `${item.inventoryItemName} and all its lots, lines and serials will be removed from this receipt.`,
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeItemMutation.mutate(item.id);
  };

  return (
    <div className="space-y-4">
      <DetailHeader
        title={item.inventoryItemName}
        actions={
          isDraft && (
            <>
              <Button
                size="sm"
                variant="outline"
                permission={binding.permissions.edit}
                startAdornment={<Pencil className="size-3.5" />}
                onClick={editItemDialog.open}
              >
                Edit Item
              </Button>
              <Button
                size="sm"
                variant="destructive"
                permission={binding.permissions.edit}
                startAdornment={<Trash2 className="size-3.5" />}
                onClick={handleRemoveItem}
                isLoading={removeItemMutation.isPending}
              >
                Remove Item
              </Button>
            </>
          )
        }
      />
      <div className="flex flex-nowrap items-start gap-2 overflow-x-auto">
        <DetailSection wrap>
          <DetailField
            className="px-4 py-2"
            label={`Ordered (${item.uomSymbol})`}
            type="number"
            value={item.orderedQty}
          />
          <DetailField
            className="px-4 py-2"
            label={`Expected Free (${item.uomSymbol})`}
            type="number"
            value={item.expectedFreeQty}
          />
          <DetailField
            className="px-4 py-2"
            label={`Already Received (${item.uomSymbol})`}
            type="number"
            value={item.alreadyReceivedQty}
          />
        </DetailSection>
        <DetailSection wrap>
          <DetailField
            className="px-4 py-2"
            label={`Received (${item.uomSymbol})`}
            type="number"
            value={item.receivedQty}
          />
          <DetailField
            className="px-4 py-2"
            label={`Rejected (${item.uomSymbol})`}
            type="number"
            value={item.rejectedQuantity}
          />
          <DetailField
            className="px-4 py-2"
            label={`Accepted (${item.uomSymbol})`}
            type="number"
            value={item.acceptedQty}
          />
          <DetailField
            className="px-4 py-2"
            label={`Distributed (${item.uomSymbol})`}
            type="number"
            value={item.distributedQty}
          />
        </DetailSection>
      </div>
      {item.flags.length > 0 && <GoodsReceiptItemFlags flags={item.flags} />}

      {usesLines ? (
        <LinesTable
          binding={binding}
          goodsReceiptId={goodsReceiptId}
          scope={{ kind: 'item', itemId: selection.itemId, inventoryItemId: item.inventoryItemId }}
          tracking={tracking}
          isDraft={isDraft}
          uomSymbol={item.uomSymbol}
          allowDecimal={item.uomAllowDecimal}
          undistributedQty={undistributedQty}
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
          binding={binding}
          goodsReceiptId={goodsReceiptId}
          itemId={selection.itemId}
          isDraft={isDraft}
          uomSymbol={item.uomSymbol}
          onSelectLot={(lotId) => onSelectionChange({ kind: 'lot', itemId: selection.itemId, lotId })}
        />
      )}

      <EditItemDialog binding={binding} goodsReceiptId={goodsReceiptId} item={item} handle={editItemDialog} />
    </div>
  );
};
