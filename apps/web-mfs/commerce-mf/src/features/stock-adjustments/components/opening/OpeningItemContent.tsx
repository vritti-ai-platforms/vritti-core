import { Empty } from '@vritti/quantum-ui/Empty';
import { PageContent, PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Boxes } from 'lucide-react';
import { useState } from 'react';
import { useStockAdjustmentLine } from '@/hooks/stock-adjustments';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { LotDetailPanel } from './LotDetailPanel';
import { LotsTreePanel } from './LotsTreePanel';
import { SerialsTable } from './SerialsTable';

interface OpeningItemContentProps {
  adjustment: StockAdjustmentData;
  isDraft: boolean;
}

// 2-column layout: lots/lines tree (left) + content (right). Right pane shows
// the lines table when a lot is selected, or the serials table when a line is selected.
export const OpeningItemContent = ({ adjustment, isDraft }: OpeningItemContentProps) => {
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const { data: selectedLine = null } = useStockAdjustmentLine(adjustment.id, selectedLineId);

  return (
    <PageContent>
      <LotsTreePanel
        adjustmentId={adjustment.id}
        isDraft={isDraft}
        uomSymbol={adjustment.inventoryItemUomSymbol}
        selectedId={selectedLineId ?? selectedLotId}
        onSelect={(sel) => {
          setSelectedLotId(sel?.lotId ?? null);
          setSelectedLineId(sel?.lineId ?? null);
        }}
      />
      {selectedLineId ? (
        <SerialsTable
          adjustmentId={adjustment.id}
          inventoryItemId={adjustment.inventoryItemId}
          line={selectedLine}
          isDraft={isDraft}
          onLineRemoved={() => setSelectedLineId(null)}
        />
      ) : selectedLotId ? (
        <PageContentDetails>
          <LotDetailPanel
            adjustmentId={adjustment.id}
            inventoryItemId={adjustment.inventoryItemId}
            lotId={selectedLotId}
            tracking="lot_serial"
            isDraft={isDraft}
            uomSymbol={adjustment.inventoryItemUomSymbol}
            onLotRemoved={() => setSelectedLotId(null)}
          />
        </PageContentDetails>
      ) : (
        <PageContentDetails className="flex items-center justify-center">
          <Empty icon={<Boxes />} title="Pick a lot or line" description="Select an entry from the tree." />
        </PageContentDetails>
      )}
    </PageContent>
  );
};
