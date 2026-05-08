import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Boxes, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import {
  useGoodsReceiptLine,
  useGoodsReceiptLots,
  useGoodsReceiptTree,
  useRemoveGoodsReceiptItem,
  useRemoveGoodsReceiptLot,
} from '@/hooks/goods-receipts';
import {
  type GoodsReceiptTreeNode,
  InventoryTrackingValues,
} from '@/schemas/goods-receipts';
import { AddLotDialog } from '../forms/AddLotDialog';
import { EditItemDialog } from '../forms/EditItemDialog';
import { EditLotDialog } from '../forms/EditLotDialog';
import { LinesTable } from './LinesTable';
import { SerialsTable } from './SerialsTable';
import type { TreeSelection } from './GoodsReceiptTreePanel';

interface RightContentProps {
  goodsReceiptId: string;
  isDraft: boolean;
  selection: TreeSelection | null;
  onSelectionChange: (selection: TreeSelection | null) => void;
}

const findItemNode = (tree: GoodsReceiptTreeNode[], itemId: string) =>
  tree.find((n) => n.kind === 'item' && n.id === itemId);

export const RightContent = ({ goodsReceiptId, isDraft, selection, onSelectionChange }: RightContentProps) => {
  const confirm = useConfirm();
  const editItemDialog = useDialog();
  const editLotDialog = useDialog();
  const addLotDialog = useDialog();
  const removeItemMutation = useRemoveGoodsReceiptItem(goodsReceiptId, {
    onSuccess: () => onSelectionChange(null),
  });
  const removeLotMutation = useRemoveGoodsReceiptLot(
    goodsReceiptId,
    selection?.kind === 'lot' || selection?.kind === 'line' ? selection.itemId : '',
    { onSuccess: () => onSelectionChange(selection ? { kind: 'item', itemId: selection.itemId } : null) },
  );

  const { data: tree = [] } = useGoodsReceiptTree(goodsReceiptId);
  const itemId = selection ? selection.itemId : null;
  const itemNode = useMemo(() => (itemId ? findItemNode(tree, itemId) : undefined), [tree, itemId]);
  const tracking = itemNode?.inventoryItemTracking;
  const uomSymbol = itemNode?.inventoryItemUomSymbol ?? null;
  const poRemaining = itemNode?.poRemainingQuantity ?? null;

  // Lots for the selected item — needed when selection.kind='lot' to derive lot details for the EditLot dialog
  const { data: lots = [] } = useGoodsReceiptLots(goodsReceiptId, itemId);
  const selectedLot = useMemo(
    () => (selection?.kind === 'lot' ? lots.find((l) => l.id === selection.lotId) ?? null : null),
    [lots, selection],
  );

  // Selected serial line — for the SerialsTable
  const lineSelection = selection?.kind === 'line' ? selection : null;
  const { data: selectedLine = null } = useGoodsReceiptLine(
    goodsReceiptId,
    lineSelection?.itemId ?? null,
    lineSelection?.lineId ?? null,
  );

  if (!selection || !tracking) {
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

  const handleRemoveItem = async () => {
    if (!itemNode) return;
    const confirmed = await confirm({
      title: `Remove ${itemNode.name}?`,
      description: 'This item and all its lots, lines, and serials will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeItemMutation.mutate(itemNode.id);
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
        inventoryItemId={itemNode!.inventoryItemId!}
        line={selectedLine}
        isDraft={isDraft}
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
    return (
      <PageContentDetails>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">{selectedLot?.lotNumber ?? '—'}</h3>
              <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <div>
                  Mfg:{' '}
                  {selectedLot?.manufacturingDate
                    ? new Date(selectedLot.manufacturingDate).toLocaleDateString()
                    : '—'}
                </div>
                <div>
                  Exp:{' '}
                  {selectedLot?.expiryDate ? new Date(selectedLot.expiryDate).toLocaleDateString() : '—'}
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
              inventoryItemId: itemNode!.inventoryItemId!,
              lotId: selection.lotId,
            }}
            tracking={tracking}
            isDraft={isDraft}
            uomSymbol={uomSymbol}
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
        </div>

        <EditLotDialog goodsReceiptId={goodsReceiptId} itemId={selection.itemId} lot={selectedLot} handle={editLotDialog} />
      </PageContentDetails>
    );
  }

  // Selected = item: render LinesTable scoped to item (for tracking='quantity' and standalone 'serial').
  // For lot/lot_serial tracking with no lot selected, show a hint to pick a lot.
  if (selection.kind === 'item') {
    if (tracking === InventoryTrackingValues.QUANTITY || tracking === InventoryTrackingValues.SERIAL) {
      return (
        <PageContentDetails>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{itemNode?.name ?? '—'}</h3>
                <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <div>
                    Accepted: {itemNode?.acceptedQuantity ?? 0} {uomSymbol ?? ''}
                  </div>
                  <div>
                    Damaged: {itemNode?.rejectedQuantity ?? 0} {uomSymbol ?? ''}
                  </div>
                  {poRemaining != null && <div className="col-span-2">PO remaining: {poRemaining}</div>}
                </div>
              </div>
              {isDraft && itemNode && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    startAdornment={<Pencil className="size-3.5" />}
                    onClick={editItemDialog.open}
                  >
                    Edit Item
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    startAdornment={<Trash2 className="size-3.5" />}
                    onClick={handleRemoveItem}
                    isLoading={removeItemMutation.isPending}
                  >
                    Remove Item
                  </Button>
                </div>
              )}
            </div>

            <LinesTable
              goodsReceiptId={goodsReceiptId}
              scope={{
                kind: 'item',
                itemId: selection.itemId,
                inventoryItemId: itemNode!.inventoryItemId!,
              }}
              tracking={tracking}
              isDraft={isDraft}
              uomSymbol={uomSymbol}
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
          </div>

          <EditItemDialog
            goodsReceiptId={goodsReceiptId}
            item={
              itemNode
                ? {
                    id: itemNode.id,
                    goodsReceiptId,
                    inventoryItemId: itemNode.inventoryItemId!,
                    inventoryItemName: itemNode.name,
                    inventoryItemTracking: tracking,
                    inventoryItemUomSymbol: uomSymbol,
                    acceptedQuantity: itemNode.acceptedQuantity ?? 0,
                    rejectedQuantity: itemNode.rejectedQuantity ?? 0,
                    lotsCount: 0,
                    linesCount: 0,
                    isBalanced: itemNode.isBalanced,
                    poOrderedQuantity: itemNode.poOrderedQuantity ?? null,
                    poReceivedQuantity: itemNode.poReceivedQuantity ?? null,
                    poRemainingQuantity: itemNode.poRemainingQuantity ?? null,
                    metadata: {},
                    createdAt: '',
                  }
                : null
            }
            handle={editItemDialog}
          />
        </PageContentDetails>
      );
    }

    // tracking is 'lot' or 'lot_serial' — item is not a leaf; user should pick a lot
    return (
      <PageContentDetails>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">{itemNode?.name ?? '—'}</h3>
              <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <div>
                  Accepted: {itemNode?.acceptedQuantity ?? 0} {uomSymbol ?? ''}
                </div>
                <div>
                  Damaged: {itemNode?.rejectedQuantity ?? 0} {uomSymbol ?? ''}
                </div>
                {poRemaining != null && <div className="col-span-2">PO remaining: {poRemaining}</div>}
              </div>
            </div>
            {isDraft && itemNode && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  startAdornment={<Pencil className="size-3.5" />}
                  onClick={editItemDialog.open}
                >
                  Edit Item
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  startAdornment={<Trash2 className="size-3.5" />}
                  onClick={handleRemoveItem}
                  isLoading={removeItemMutation.isPending}
                >
                  Remove Item
                </Button>
              </div>
            )}
          </div>
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
        </div>

        <AddLotDialog goodsReceiptId={goodsReceiptId} itemId={selection.itemId} handle={addLotDialog} />

        <EditItemDialog
          goodsReceiptId={goodsReceiptId}
          item={
            itemNode
              ? {
                  id: itemNode.id,
                  goodsReceiptId,
                  inventoryItemId: itemNode.inventoryItemId!,
                  inventoryItemName: itemNode.name,
                  inventoryItemTracking: tracking,
                  inventoryItemUomSymbol: uomSymbol,
                  acceptedQuantity: itemNode.acceptedQuantity ?? 0,
                  rejectedQuantity: itemNode.rejectedQuantity ?? 0,
                  lotsCount: 0,
                  linesCount: 0,
                  isBalanced: itemNode.isBalanced,
                  poOrderedQuantity: itemNode.poOrderedQuantity ?? null,
                  poReceivedQuantity: itemNode.poReceivedQuantity ?? null,
                  poRemainingQuantity: itemNode.poRemainingQuantity ?? null,
                  metadata: {},
                  createdAt: '',
                }
              : null
          }
          handle={editItemDialog}
        />
      </PageContentDetails>
    );
  }

  return null;
};
