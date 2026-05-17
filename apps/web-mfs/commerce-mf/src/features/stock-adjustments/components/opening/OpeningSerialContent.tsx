import { PageContent } from '@vritti/quantum-ui/PageContent';
import { useState } from 'react';
import { useStockAdjustmentLine } from '@/hooks/stock-adjustments';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { OpeningLinesSidePanel } from './OpeningLinesSidePanel';
import { SerialsTable } from './SerialsTable';

interface OpeningSerialContentProps {
  adjustment: StockAdjustmentData;
  isDraft: boolean;
}

export const OpeningSerialContent = ({ adjustment, isDraft }: OpeningSerialContentProps) => {
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const { data: selectedLine = null } = useStockAdjustmentLine(adjustment.id, selectedLineId);

  return (
    <PageContent>
      <OpeningLinesSidePanel
        adjustment={adjustment}
        isDraft={isDraft}
        selectedLineId={selectedLineId}
        onSelect={setSelectedLineId}
      />
      <SerialsTable
        adjustmentId={adjustment.id}
        inventoryItemId={adjustment.inventoryItemId}
        line={selectedLine}
        isDraft={isDraft}
        onLineRemoved={() => setSelectedLineId(null)}
      />
    </PageContent>
  );
};
