import { Button } from '@vritti/quantum-ui/Button';
import { DetailField, DetailHeader, DetailSection } from '@vritti/quantum-ui/DetailField';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Pencil, Trash2 } from 'lucide-react';
import { type GoodsReceiptItemData, type GoodsReceiptLotData, InventoryTrackingValues } from '@/schemas/goods-receipts';
import { useGoodsReceiptItem, useGoodsReceiptLots, useRemoveGoodsReceiptLot } from '@/site/hooks/goods-receipts';
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
  const remainingToDistribute = Math.max(item.totalQty - item.acceptedQuantity, 0);

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
      <div className="space-y-6">
        <DetailHeader
          title={lot.lotNumber}
          actions={
            isDraft ? (
              <>
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
              </>
            ) : undefined
          }
        />
        <div className="flex flex-nowrap items-start gap-2 overflow-x-auto">
          <DetailSection wrap>
            <DetailField className="px-4 py-2" label="Mfg Date" type="date" value={lot.manufacturingDate} />
            <DetailField className="px-4 py-2" label="Exp Date" type="date" value={lot.expiryDate} />
            <DetailField
              className="px-4 py-2"
              label="Total"
              type="string"
              mono
              value={`${lot.totalQuantity} ${uomSymbol ?? ''}`}
            />
            <DetailField className="px-4 py-2" label="Lines" type="number" value={lot.linesCount} />
          </DetailSection>
        </div>
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

      <EditLotDialog
        goodsReceiptId={goodsReceiptId}
        itemId={selection.itemId}
        lot={lot}
        hasMrp={item.inventoryItemHasMrp}
        handle={editLotDialog}
      />
    </div>
  );
};
