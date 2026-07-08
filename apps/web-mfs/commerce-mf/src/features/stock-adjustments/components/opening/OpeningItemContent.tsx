import { Empty } from '@vritti/quantum-ui/Empty';
import { PageContent, PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Boxes } from 'lucide-react';
import { useState } from 'react';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { LotDetailPanel } from './LotDetailPanel';
import { LotsTreePanel } from './LotsTreePanel';
import { SerialsTable } from './SerialsTable';

interface OpeningItemContentProps {
  adjustment: StockAdjustmentData;
  isDraft: boolean;
}

// 2-column layout: lots/lines tree on the left, selected lot or line detail on the right.
export const OpeningItemContent = ({ adjustment, isDraft }: OpeningItemContentProps) => {
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

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
          lineId={selectedLineId}
          isDraft={isDraft}
          onLineRemoved={() => setSelectedLineId(null)}
        />
      ) : selectedLotId ? (
        <LotDetailPanel
          adjustmentId={adjustment.id}
          inventoryItemId={adjustment.inventoryItemId}
          primaryUomId={adjustment.inventoryItemUomId}
          lotId={selectedLotId}
          tracking="lot_serial"
          isDraft={isDraft}
          uomSymbol={adjustment.inventoryItemUomSymbol}
          onLotRemoved={() => setSelectedLotId(null)}
        />
      ) : (
        <PageContentDetails
          isEmpty
          emptyState={
            <Empty icon={<Boxes />} title="Pick a lot or line" description="Select an entry from the tree." />
          }
        />
      )}
    </PageContent>
  );
};
