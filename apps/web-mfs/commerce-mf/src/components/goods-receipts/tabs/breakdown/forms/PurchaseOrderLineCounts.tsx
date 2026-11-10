import { DetailField, DetailSection } from '@vritti/quantum-ui/DetailField';
import type React from 'react';

interface PurchaseOrderLineCountsProps {
  uomSymbol: string;
  orderedQty: number;
  expectedFreeQty: number;
  alreadyReceivedQty: number;
}

// What the purchase order line expects and what earlier receipts already brought in, beside the count being entered
export const PurchaseOrderLineCounts: React.FC<PurchaseOrderLineCountsProps> = ({
  uomSymbol,
  orderedQty,
  expectedFreeQty,
  alreadyReceivedQty,
}) => (
  <DetailSection wrap>
    <DetailField className="px-4 py-2" label={`Ordered (${uomSymbol})`} type="number" value={orderedQty} />
    <DetailField className="px-4 py-2" label={`Expected Free (${uomSymbol})`} type="number" value={expectedFreeQty} />
    <DetailField
      className="px-4 py-2"
      label={`Already Received (${uomSymbol})`}
      type="number"
      value={alreadyReceivedQty}
    />
  </DetailSection>
);
