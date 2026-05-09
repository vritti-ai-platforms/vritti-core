import { PageContent } from '@vritti/quantum-ui/PageContent';
import { useState } from 'react';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { LotDetailPanel } from './LotDetailPanel';
import { LotSidePanel } from './LotSidePanel';

interface OpeningLotContentProps {
  adjustment: StockAdjustmentData;
  isDraft: boolean;
}

export const OpeningLotContent = ({ adjustment, isDraft }: OpeningLotContentProps) => {
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  return (
    <PageContent>
      <LotSidePanel
        adjustmentId={adjustment.id}
        isDraft={isDraft}
        uomSymbol={adjustment.inventoryItemUomSymbol}
        selectedLotId={selectedLotId}
        onSelectLot={setSelectedLotId}
      />
      <LotDetailPanel
        adjustmentId={adjustment.id}
        inventoryItemId={adjustment.inventoryItemId}
        lotId={selectedLotId}
        tracking="lot"
        isDraft={isDraft}
        uomSymbol={adjustment.inventoryItemUomSymbol}
        onLotRemoved={() => setSelectedLotId(null)}
      />
    </PageContent>
  );
};
