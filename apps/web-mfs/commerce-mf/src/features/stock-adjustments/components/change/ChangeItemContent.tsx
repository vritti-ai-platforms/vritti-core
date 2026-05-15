import { PageContent } from '@vritti/quantum-ui/PageContent';
import { useState } from 'react';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { LineSerialsPanel } from './LineSerialsPanel';
import { LinesSidePanel } from './LinesSidePanel';

interface ChangeItemContentProps {
  adjustment: StockAdjustmentData;
  isDraft: boolean;
}

export const ChangeItemContent = ({ adjustment, isDraft }: ChangeItemContentProps) => {
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  return (
    <PageContent>
      <LinesSidePanel
        adjustment={adjustment}
        isDraft={isDraft}
        selectedLineId={selectedLineId}
        onSelect={setSelectedLineId}
      />
      <LineSerialsPanel
        adjustment={adjustment}
        lineId={selectedLineId}
        isDraft={isDraft}
        onLineRemoved={() => setSelectedLineId(null)}
      />
    </PageContent>
  );
};
