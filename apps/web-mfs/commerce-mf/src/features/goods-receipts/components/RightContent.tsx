import { Button } from '@vritti/quantum-ui/Button';
import { CompactTableSkeleton } from '@vritti/quantum-ui/DataTable';
import { DetailField, DetailSection } from '@vritti/quantum-ui/DetailField';
import { Empty } from '@vritti/quantum-ui/Empty';
import { FormattedDate } from '@vritti/quantum-ui/FormattedDate';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Boxes, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import {
  useGoodsReceiptItem,
  useGoodsReceiptLine,
  useGoodsReceiptLots,
  useRemoveGoodsReceiptItem,
  useRemoveGoodsReceiptLot,
} from '@/hooks/goods-receipts';
import {
  type GoodsReceiptItemData,
  type GoodsReceiptLotData,
  InventoryTrackingValues,
} from '@/schemas/goods-receipts';
import { AddLotDialog } from '../forms/AddLotDialog';
import { EditItemDialog } from '../forms/EditItemDialog';
import { EditLotDialog } from '../forms/EditLotDialog';
import type { TreeSelection } from './GoodsReceiptTreePanel';
import { LinesTable } from './LinesTable';
import { SerialsTable } from './SerialsTable';

interface RightContentProps {
  goodsReceiptId: string;
  isDraft: boolean;
  selection: TreeSelection | null;
  onSelectionChange: (selection: TreeSelection | null) => void;
}

export const RightContent = ({ goodsReceiptId, isDraft, selection, onSelectionChange }: RightContentProps) => {
  if (!selection) {
    return (
      <PageContentDetails className="flex items-center justify-center">
        <Empty
          icon={<Boxes />}
          title="Pick an item, lot, or line"
          description="Select an entry from the tree on the left."
        />
      </PageContentDetails>
    );
  }
  return (
    <SelectedContent
      goodsReceiptId={goodsReceiptId}
      isDraft={isDraft}
      selection={selection}
      onSelectionChange={onSelectionChange}
    />
  );
};

// Inner component so the item-detail hook gates everything: the item shape carries the tracking,
// uomSymbol, allowDecimal, etc. that the per-kind panels need. While it loads we show a skeleton
// in the details column (mirrors the SA LotDetailPanel pattern).
const SelectedContent = ({
  goodsReceiptId,
  isDraft,
  selection,
  onSelectionChange,
}: RightContentProps & { selection: TreeSelection }) => {
  const { data: item, isLoading: isItemLoading } = useGoodsReceiptItem(goodsReceiptId, selection.itemId);

  return (
    <PageContentDetails
      isLoading={isItemLoading || !item}
      loadingContent={<DetailSkeleton />}
      isEmpty={false}
    >
      {item ? (
        <Resolved
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

// Skeleton for the details column. Mirrors LotDetailPanelSkeleton in stock-adjustments:
// title row + stat plate + table toolbar + compact table.
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-6 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>
      <DetailSection>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: <static skeleton list>
            key={`gr-stat-${i}`}
            className="space-y-1.5 px-4 py-2"
          >
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </DetailSection>
      <div className="flex items-center justify-end">
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <CompactTableSkeleton
        rows={5}
        actions
        columns={[
          { headerWidth: 'w-20', cellWidth: 'w-28' },
          { headerWidth: 'w-16', cellWidth: 'w-16' },
        ]}
      />
    </div>
  );
}

interface ResolvedProps {
  goodsReceiptId: string;
  isDraft: boolean;
  selection: TreeSelection;
  onSelectionChange: (selection: TreeSelection | null) => void;
  item: GoodsReceiptItemData;
}

const Resolved = ({ goodsReceiptId, isDraft, selection, onSelectionChange, item }: ResolvedProps) => {
  const confirm = useConfirm();
  const editItemDialog = useDialog();
  const editLotDialog = useDialog();
  const addLotDialog = useDialog();

  const removeItemMutation = useRemoveGoodsReceiptItem(goodsReceiptId, {
    onSuccess: () => onSelectionChange(null),
  });
  const removeLotMutation = useRemoveGoodsReceiptLot(goodsReceiptId, item.id, {
    onSuccess: () => onSelectionChange({ kind: 'item', itemId: item.id }),
  });

  // Lots needed when a lot is selected — the LotsList endpoint is cheap enough to keep using
  // here. Replace with a single-lot detail endpoint if we ever need richer lot fields.
  const { data: lots = [], isLoading: isLotsLoading } = useGoodsReceiptLots(
    goodsReceiptId,
    selection.kind === 'lot' || selection.kind === 'line' ? item.id : null,
  );
  const selectedLot = useMemo<GoodsReceiptLotData | null>(
    () => (selection.kind === 'lot' ? (lots.find((l) => l.id === selection.lotId) ?? null) : null),
    [lots, selection],
  );

  const lineSelection = selection.kind === 'line' ? selection : null;
  const { data: selectedLine = null } = useGoodsReceiptLine(
    goodsReceiptId,
    lineSelection?.itemId ?? null,
    lineSelection?.lineId ?? null,
  );

  const tracking = item.inventoryItemTracking;
  const uomSymbol = item.inventoryItemUomSymbol;
  const allowDecimal = item.inventoryItemAllowDecimal;
  const poRemaining =
    item.poRemainingQuantity != null ? Math.max(item.poRemainingQuantity - item.acceptedQuantity, 0) : null;

  const handleRemoveItem = async () => {
    const confirmed = await confirm({
      title: `Remove ${item.inventoryItemName}?`,
      description: 'This item and all its lots, lines, and serials will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeItemMutation.mutate(item.id);
  };

  const handleRemoveLot = async () => {
    if (!selectedLot) return;
    const confirmed = await confirm({
      title: `Remove lot ${selectedLot.lotNumber}?`,
      description: 'This lot and all its lines and serials will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeLotMutation.mutate(selectedLot.id);
  };

  // Selected = serial line → SerialsTable
  if (
    selection.kind === 'line' &&
    (tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL)
  ) {
    return (
      <SerialsTable
        goodsReceiptId={goodsReceiptId}
        itemId={selection.itemId}
        inventoryItemId={item.inventoryItemId}
        line={selectedLine}
        isDraft={isDraft}
        allowDecimal={allowDecimal}
        onLineRemoved={() =>
          onSelectionChange(
            selection.lotId
              ? { kind: 'lot', itemId: selection.itemId, lotId: selection.lotId }
              : { kind: 'item', itemId: selection.itemId },
          )
        }
      />
    );
  }

  // Selected = lot → LinesTable scoped to lot
  if (selection.kind === 'lot') {
    if (isLotsLoading && !selectedLot) {
      return <DetailSkeleton />;
    }
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">{selectedLot?.lotNumber ?? '—'}</h3>
            <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <div>
                Mfg: <FormattedDate value={selectedLot?.manufacturingDate} dateFormat="P" />
              </div>
              <div>
                Exp: <FormattedDate value={selectedLot?.expiryDate} dateFormat="P" />
              </div>
              <div>
                Total: {selectedLot?.totalQuantity ?? 0} {uomSymbol ?? ''}
              </div>
              <div>Lines: {selectedLot?.linesCount ?? 0}</div>
            </div>
          </div>
          {isDraft && selectedLot && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                startAdornment={<Pencil className="size-3.5" />}
                onClick={editLotDialog.open}
              >
                Edit Lot
              </Button>
              <Button
                size="sm"
                variant="destructive"
                startAdornment={<Trash2 className="size-3.5" />}
                onClick={handleRemoveLot}
                isLoading={removeLotMutation.isPending}
              >
                Remove Lot
              </Button>
            </div>
          )}
        </div>

        <LinesTable
          goodsReceiptId={goodsReceiptId}
          scope={{
            kind: 'lot',
            itemId: selection.itemId,
            inventoryItemId: item.inventoryItemId,
            lotId: selection.lotId,
          }}
          tracking={tracking}
          isDraft={isDraft}
          uomSymbol={uomSymbol}
          allowDecimal={allowDecimal}
          poRemainingQuantity={poRemaining}
          selectedLineId={null}
          onSelectLine={
            tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL
              ? (lineId) =>
                  onSelectionChange(
                    lineId
                      ? { kind: 'line', itemId: selection.itemId, lotId: selection.lotId, lineId }
                      : { kind: 'lot', itemId: selection.itemId, lotId: selection.lotId },
                  )
              : undefined
          }
        />

        <EditLotDialog
          goodsReceiptId={goodsReceiptId}
          itemId={selection.itemId}
          lot={selectedLot}
          handle={editLotDialog}
        />
      </div>
    );
  }

  // Selected = item: render LinesTable scoped to item (for tracking='quantity' and standalone 'serial').
  // For lot/lot_serial tracking with no lot selected, show a hint to pick a lot.
  if (tracking === InventoryTrackingValues.QUANTITY || tracking === InventoryTrackingValues.SERIAL) {
    return (
      <div className="space-y-4">
        <ItemHeader
          item={item}
          uomSymbol={uomSymbol}
          poRemaining={poRemaining}
          isDraft={isDraft}
          onEdit={editItemDialog.open}
          onRemove={handleRemoveItem}
          isRemovePending={removeItemMutation.isPending}
        />

        <LinesTable
          goodsReceiptId={goodsReceiptId}
          scope={{
            kind: 'item',
            itemId: selection.itemId,
            inventoryItemId: item.inventoryItemId,
          }}
          tracking={tracking}
          isDraft={isDraft}
          uomSymbol={uomSymbol}
          allowDecimal={allowDecimal}
          poRemainingQuantity={poRemaining}
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

        <EditItemDialog goodsReceiptId={goodsReceiptId} item={item} handle={editItemDialog} />
      </div>
    );
  }

  // tracking is 'lot' or 'lot_serial' — item is not a leaf; user should pick a lot
  return (
    <div className="space-y-4">
      <ItemHeader
        item={item}
        uomSymbol={uomSymbol}
        poRemaining={poRemaining}
        isDraft={isDraft}
        onEdit={editItemDialog.open}
        onRemove={handleRemoveItem}
        isRemovePending={removeItemMutation.isPending}
      />
      <Empty
        icon={<Boxes />}
        title="Pick a lot"
        description="Select a lot from the tree (or add a new one) to receive stock under this item."
        action={
          isDraft ? (
            <Button startAdornment={<Plus className="size-4" />} onClick={addLotDialog.open}>
              Add Lot
            </Button>
          ) : undefined
        }
      />

      <AddLotDialog goodsReceiptId={goodsReceiptId} itemId={selection.itemId} handle={addLotDialog} />
      <EditItemDialog goodsReceiptId={goodsReceiptId} item={item} handle={editItemDialog} />
    </div>
  );
};

interface ItemHeaderProps {
  item: GoodsReceiptItemData;
  uomSymbol: string;
  poRemaining: number | null;
  isDraft: boolean;
  onEdit: () => void;
  onRemove: () => void;
  isRemovePending: boolean;
}

const ItemHeader = ({ item, uomSymbol, poRemaining, isDraft, onEdit, onRemove, isRemovePending }: ItemHeaderProps) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <h3 className="text-xl font-semibold">{item.inventoryItemName}</h3>
      <DetailSection wrap className="mt-2">
        <DetailField className="px-4 py-2" label="Accepted" type="string" mono value={`${item.acceptedQuantity} ${uomSymbol}`} />
        <DetailField className="px-4 py-2" label="Damaged" type="string" mono value={`${item.rejectedQuantity} ${uomSymbol}`} />
        {poRemaining != null && (
          <DetailField className="px-4 py-2" label="PO Remaining" type="string" mono value={`${poRemaining} ${uomSymbol}`} />
        )}
      </DetailSection>
    </div>
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
);
