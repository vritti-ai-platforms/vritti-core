import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import type React from 'react';
import type { GoodsReceiptsBinding } from '../../bindings';
import type { TreeSelection } from '../../types';
import { BreakdownDetailSkeleton } from './BreakdownDetailSkeleton';
import { SerialsTable } from './SerialsTable';

interface LineDetailPanelProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  isDraft: boolean;
  selection: Extract<TreeSelection, { kind: 'line' }>;
  onSelectionChange: (selection: TreeSelection | null) => void;
}

// A picked line of a serial-tracked item: the serials put away in it
export const LineDetailPanel: React.FC<LineDetailPanelProps> = ({
  binding,
  goodsReceiptId,
  isDraft,
  selection,
  onSelectionChange,
}) => {
  const { data: item, isLoading: isItemLoading } = binding.useItem(goodsReceiptId, selection.itemId);
  const { data: line, isLoading: isLineLoading } = binding.useLine(goodsReceiptId, selection.itemId, selection.lineId);

  return (
    <PageContentDetails
      isLoading={isItemLoading || isLineLoading || !item || !line}
      loadingContent={<BreakdownDetailSkeleton />}
    >
      {item && line && (
        <SerialsTable
          binding={binding}
          goodsReceiptId={goodsReceiptId}
          itemId={selection.itemId}
          inventoryItemId={item.inventoryItemId}
          line={line}
          isDraft={isDraft}
          allowDecimal={item.uomAllowDecimal}
          undistributedQty={Math.max(item.acceptedQty - item.distributedQty, 0)}
          onLineRemoved={() =>
            onSelectionChange(
              selection.lotId
                ? { kind: 'lot', itemId: selection.itemId, lotId: selection.lotId }
                : { kind: 'item', itemId: selection.itemId },
            )
          }
        />
      )}
    </PageContentDetails>
  );
};
