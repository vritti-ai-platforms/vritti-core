import { PageContent } from '@vritti/quantum-ui/PageContent';
import type React from 'react';
import { useState } from 'react';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import { GoodsReceiptTreePanel, type TreeSelection } from '../components/GoodsReceiptTreePanel';
import { RightContent } from '../components/RightContent';

interface BreakdownTabProps {
  receipt: GoodsReceiptData;
  isDraft: boolean;
}

export const BreakdownTab: React.FC<BreakdownTabProps> = ({ receipt, isDraft }) => {
  const [selection, setSelection] = useState<TreeSelection | null>(null);

  return (
    <PageContent>
      <GoodsReceiptTreePanel
        goodsReceiptId={receipt.id}
        isDraft={isDraft}
        poId={receipt.po?.id ?? null}
        supplierId={receipt.supplierId}
        supplierCurrencyCode={receipt.supplierCurrencyCode}
        selection={selection}
        onSelect={setSelection}
      />
      <RightContent
        goodsReceiptId={receipt.id}
        isDraft={isDraft}
        selection={selection}
        onSelectionChange={setSelection}
      />
    </PageContent>
  );
};
