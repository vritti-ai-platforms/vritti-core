import { Button } from '@vritti/quantum-ui/Button';
import { FormattedDate } from '@vritti/quantum-ui/FormattedDate';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Pencil, Trash2 } from 'lucide-react';
import { useGoodsReceiptItem, useGoodsReceiptLots, useRemoveGoodsReceiptLot } from '@/hooks/goods-receipts';
import { type GoodsReceiptItemData, type GoodsReceiptLotData, InventoryTrackingValues } from '@/schemas/goods-receipts';
import { EditLotDialog } from '../forms/EditLotDialog';
import { GoodsReceiptDetailSkeleton } from './GoodsReceiptDetailSkeleton';
import type { TreeSelection } from './GoodsReceiptTreePanel';
import { LinesTable } from './LinesTable';

interface LotDetailPanelProps {
  goodsReceiptId: string;
  isDraft: boolean;
  selection: Extract<TreeSelection, { kind: 'lot' }>;
  onSelectionChange: (selection: TreeSelection | null) => void;
}

export const LotDetailPanel = ({ goodsReceiptId, isDraft, selection, onSelectionChange }: LotDetailPanelProps) => {
  const { data: item, isLoading: isItemLoading } = useGoodsReceiptItem(goodsReceiptId, selection.itemId);
  const { data: lots = [], isLoading: isLotsLoading } = useGoodsReceiptLots(goodsReceiptId, selection.itemId);
  const lot = lots.find((l) => l.id === selection.lotId) ?? null;

  return (
    <PageContentDetails
      isLoading={isItemLoading || !item || (isLotsLoading && !lot)}
      loadingContent={<GoodsReceiptDetailSkeleton />}
    >
      {item && lot ? (
        <LotDetailContent
          goodsReceiptId={goodsReceiptId}
          isDraft={isDraft}
          selection={selection}
          onSelectionChange={onSelectionChange}
          item={item}
          lot={lot}
        />
      ) : null}
    </PageContentDetails>
  );
};

const LotDetailContent = ({
  goodsReceiptId,
  isDraft,
  selection,
  onSelectionChange,
  item,
  lot,
}: LotDetailPanelProps & { item: GoodsReceiptItemData; lot: GoodsReceiptLotData }) => {
  const confirm = useConfirm();
  const editLotDialog = useDialog();
  const removeLotMutation = useRemoveGoodsReceiptLot(goodsReceiptId, item.id, {
    onSuccess: () => onSelectionChange({ kind: 'item', itemId: item.id }),
  });

  const uomSymbol = item.inventoryItemUomSymbol;
  const remainingToDistribute = Math.max(item.quantity - item.acceptedQuantity, 0);

  const handleRemoveLot = async () => {
    const confirmed = await confirm({
      title: `Remove lot ${lot.lotNumber}?`,
      description: 'This lot and all its lines and serials will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeLotMutation.mutate(lot.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{lot.lotNumber}</h3>
          <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <div>
              Mfg: <FormattedDate value={lot.manufacturingDate} dateFormat="P" />
            </div>
            <div>
              Exp: <FormattedDate value={lot.expiryDate} dateFormat="P" />
            </div>
            <div>
              Total: {lot.totalQuantity} {uomSymbol ?? ''}
            </div>
            <div>Lines: {lot.linesCount}</div>
          </div>
        </div>
        {isDraft && (
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
        scope={{ kind: 'lot', itemId: selection.itemId, inventoryItemId: item.inventoryItemId, lotId: selection.lotId }}
        tracking={item.inventoryItemTracking}
        isDraft={isDraft}
        uomSymbol={uomSymbol}
        allowDecimal={item.inventoryItemAllowDecimal}
        poRemainingQuantity={remainingToDistribute}
        selectedLineId={null}
        onSelectLine={
          item.inventoryItemTracking === InventoryTrackingValues.SERIAL ||
          item.inventoryItemTracking === InventoryTrackingValues.LOT_SERIAL
            ? (lineId) =>
                onSelectionChange(
                  lineId
                    ? { kind: 'line', itemId: selection.itemId, lotId: selection.lotId, lineId }
                    : { kind: 'lot', itemId: selection.itemId, lotId: selection.lotId },
                )
            : undefined
        }
      />

      <EditLotDialog goodsReceiptId={goodsReceiptId} itemId={selection.itemId} lot={lot} handle={editLotDialog} />
    </div>
  );
};
