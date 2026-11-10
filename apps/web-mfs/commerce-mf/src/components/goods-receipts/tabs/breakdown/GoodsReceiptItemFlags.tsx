import { Alert } from '@vritti/quantum-ui/Alert';
import type React from 'react';
import { type GoodsReceiptItemFlag, goodsReceiptItemFlagLabels } from '@/schemas/goods-receipts';

interface GoodsReceiptItemFlagsProps {
  flags: GoodsReceiptItemFlag[];
}

// What the count found against the purchase order line — information for whoever checks the receipt, never a block
export const GoodsReceiptItemFlags: React.FC<GoodsReceiptItemFlagsProps> = ({ flags }) => (
  <div className="flex flex-col gap-2">
    {flags.map((flag) => (
      <Alert
        key={flag.code}
        variant="warning"
        title={goodsReceiptItemFlagLabels[flag.code]}
        description={flag.detail}
      />
    ))}
  </div>
);
