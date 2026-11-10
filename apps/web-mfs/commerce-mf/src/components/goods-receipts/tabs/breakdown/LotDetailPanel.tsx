import { Button } from '@vritti/quantum-ui/Button';
import { DetailField, DetailHeader, DetailSection } from '@vritti/quantum-ui/DetailField';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Pencil, Trash2 } from 'lucide-react';
import type React from 'react';
import type { GoodsReceiptItemData, GoodsReceiptLotData } from '@/schemas/goods-receipts';
import { InventoryTrackingValues } from '@/schemas/inventory-items';
import type { GoodsReceiptsBinding } from '../../bindings';
import type { TreeSelection } from '../../types';
import { BreakdownDetailSkeleton } from './BreakdownDetailSkeleton';
import { EditLotDialog } from './forms/EditLotDialog';
import { LinesTable } from './LinesTable';

interface LotDetailPanelProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  isDraft: boolean;
  selection: Extract<TreeSelection, { kind: 'lot' }>;
  onSelectionChange: (selection: TreeSelection | null) => void;
}

// A picked lot of an item: its batch facts and the lines it is put away in
export const LotDetailPanel: React.FC<LotDetailPanelProps> = (props) => {
  const { binding, goodsReceiptId, selection } = props;
  const { data: item, isLoading: isItemLoading } = binding.useItem(goodsReceiptId, selection.itemId);
  const { data: lots = [], isLoading: isLotsLoading } = binding.useLots(goodsReceiptId, selection.itemId);
  const lot = lots.find((candidate) => candidate.id === selection.lotId);

  return (
    <PageContentDetails
      isLoading={isItemLoading || isLotsLoading || !item || !lot}
      loadingContent={<BreakdownDetailSkeleton />}
    >
      {item && lot && <LotDetailContent {...props} item={item} lot={lot} />}
    </PageContentDetails>
  );
};

// The lot's header and lines
const LotDetailContent: React.FC<LotDetailPanelProps & { item: GoodsReceiptItemData; lot: GoodsReceiptLotData }> = ({
  binding,
  goodsReceiptId,
  isDraft,
  selection,
  onSelectionChange,
  item,
  lot,
}) => {
  const confirm = useConfirm();
  const editLotDialog = useDialog();
  const removeLotMutation = binding.useRemoveLot(goodsReceiptId, item.id, {
    onSuccess: () => onSelectionChange({ kind: 'item', itemId: item.id }),
  });
  const isSerialTracked = item.inventoryItemTracking === InventoryTrackingValues.LOT_SERIAL;

  // Confirms and removes the lot with its lines and serials
  const handleRemoveLot = async () => {
    const confirmed = await confirm({
      title: `Remove lot ${lot.lotNumber}?`,
      description: `Lot ${lot.lotNumber} and all its lines and serials will be removed from ${item.inventoryItemName}.`,
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeLotMutation.mutate(lot.id);
  };

  return (
    <div className="space-y-4">
      <DetailHeader
        title={lot.lotNumber}
        actions={
          isDraft && (
            <>
              <Button
                size="sm"
                variant="outline"
                permission={binding.permissions.edit}
                startAdornment={<Pencil className="size-3.5" />}
                onClick={editLotDialog.open}
              >
                Edit Lot
              </Button>
              <Button
                size="sm"
                variant="destructive"
                permission={binding.permissions.edit}
                startAdornment={<Trash2 className="size-3.5" />}
                onClick={handleRemoveLot}
                isLoading={removeLotMutation.isPending}
              >
                Remove Lot
              </Button>
            </>
          )
        }
      />
      <div className="flex flex-nowrap items-start gap-2 overflow-x-auto">
        <DetailSection wrap>
          <DetailField className="px-4 py-2" label="Mfg Date" type="date" value={lot.manufacturingDate} />
          <DetailField className="px-4 py-2" label="Exp Date" type="date" value={lot.expiryDate} />
          <DetailField className="px-4 py-2" label="MRP" type="currency" value={lot.mrp} />
          <DetailField
            className="px-4 py-2"
            label={`Quantity (${item.uomSymbol})`}
            type="number"
            value={lot.totalQuantity}
          />
          <DetailField className="px-4 py-2" label="Lines" type="number" value={lot.linesCount} />
        </DetailSection>
      </div>

      <LinesTable
        binding={binding}
        goodsReceiptId={goodsReceiptId}
        scope={{ kind: 'lot', itemId: selection.itemId, inventoryItemId: item.inventoryItemId, lotId: selection.lotId }}
        tracking={item.inventoryItemTracking}
        isDraft={isDraft}
        uomSymbol={item.uomSymbol}
        allowDecimal={item.uomAllowDecimal}
        undistributedQty={Math.max(item.acceptedQty - item.distributedQty, 0)}
        onSelectLine={
          isSerialTracked
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
        binding={binding}
        goodsReceiptId={goodsReceiptId}
        itemId={selection.itemId}
        lot={lot}
        handle={editLotDialog}
      />
    </div>
  );
};
