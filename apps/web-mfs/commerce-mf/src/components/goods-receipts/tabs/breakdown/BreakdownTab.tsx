import { PageContent } from '@vritti/quantum-ui/PageContent';
import type React from 'react';
import { useState } from 'react';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import type { GoodsReceiptsBinding } from '../../bindings';
import type { TreeSelection } from '../../types';
import { BreakdownDetails } from './BreakdownDetails';
import { GoodsReceiptTreePanel } from './GoodsReceiptTreePanel';

interface BreakdownTabProps {
  binding: GoodsReceiptsBinding;
  receipt: GoodsReceiptData;
  isDraft: boolean;
}

// The receipt's items, lots and lines as a tree beside the details of the one picked
export const BreakdownTab: React.FC<BreakdownTabProps> = ({ binding, receipt, isDraft }) => {
  const [selection, setSelection] = useState<TreeSelection | null>(null);

  return (
    <PageContent>
      <GoodsReceiptTreePanel
        binding={binding}
        receipt={receipt}
        isDraft={isDraft}
        selection={selection}
        onSelect={setSelection}
      />
      <BreakdownDetails
        binding={binding}
        goodsReceiptId={receipt.id}
        isDraft={isDraft}
        selection={selection}
        onSelectionChange={setSelection}
      />
    </PageContent>
  );
};
