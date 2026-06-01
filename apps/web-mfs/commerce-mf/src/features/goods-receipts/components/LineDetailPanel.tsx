import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { useGoodsReceiptItem, useGoodsReceiptLine } from '@/hooks/goods-receipts';
import { GoodsReceiptDetailSkeleton } from './GoodsReceiptDetailSkeleton';
import type { TreeSelection } from './GoodsReceiptTreePanel';
import { SerialsTable } from './SerialsTable';

interface LineDetailPanelProps {
  goodsReceiptId: string;
  isDraft: boolean;
  selection: Extract<TreeSelection, { kind: 'line' }>;
  onSelectionChange: (selection: TreeSelection | null) => void;
}

export const LineDetailPanel = ({ goodsReceiptId, isDraft, selection, onSelectionChange }: LineDetailPanelProps) => {
  const { data: item, isLoading: isItemLoading } = useGoodsReceiptItem(goodsReceiptId, selection.itemId);
  const { data: line = null, isLoading: isLineLoading } = useGoodsReceiptLine(
    goodsReceiptId,
    selection.itemId,
    selection.lineId,
  );

  return (
    <PageContentDetails
      isLoading={isItemLoading || !item || (isLineLoading && !line)}
      loadingContent={<GoodsReceiptDetailSkeleton />}
    >
      {item && line ? (
        <SerialsTable
          goodsReceiptId={goodsReceiptId}
          itemId={selection.itemId}
          inventoryItemId={item.inventoryItemId}
          line={line}
          isDraft={isDraft}
          allowDecimal={item.inventoryItemAllowDecimal}
          poRemainingQuantity={Math.max(item.totalQty - item.acceptedQuantity, 0)}
          onLineRemoved={() =>
            onSelectionChange(
              selection.lotId
                ? { kind: 'lot', itemId: selection.itemId, lotId: selection.lotId }
                : { kind: 'item', itemId: selection.itemId },
            )
          }
        />
      ) : null}
    </PageContentDetails>
  );
};
