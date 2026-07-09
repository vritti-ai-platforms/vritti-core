import { Empty } from '@vritti/quantum-ui/Empty';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Boxes } from 'lucide-react';
import type { TreeSelection } from './GoodsReceiptTreePanel';
import { ItemDetailPanel } from './ItemDetailPanel';
import { LineDetailPanel } from './LineDetailPanel';
import { LotDetailPanel } from './LotDetailPanel';

interface RightContentProps {
  goodsReceiptId: string;
  isDraft: boolean;
  selection: TreeSelection | null;
  onSelectionChange: (selection: TreeSelection | null) => void;
}

// Dispatches the GR breakdown detail column to a per-kind panel; each panel owns its own fetch/skeleton.
export const RightContent = ({ goodsReceiptId, isDraft, selection, onSelectionChange }: RightContentProps) => {
  switch (selection?.kind) {
    case 'item':
      return (
        <ItemDetailPanel
          goodsReceiptId={goodsReceiptId}
          isDraft={isDraft}
          selection={selection}
          onSelectionChange={onSelectionChange}
        />
      );
    case 'lot':
      return (
        <LotDetailPanel
          goodsReceiptId={goodsReceiptId}
          isDraft={isDraft}
          selection={selection}
          onSelectionChange={onSelectionChange}
        />
      );
    case 'line':
      return (
        <LineDetailPanel
          goodsReceiptId={goodsReceiptId}
          isDraft={isDraft}
          selection={selection}
          onSelectionChange={onSelectionChange}
        />
      );
    default:
      return (
        <PageContentDetails
          isEmpty
          emptyState={
            <Empty
              icon={<Boxes />}
              title="Pick an item, lot, or line"
              description="Select an entry from the tree on the left."
            />
          }
        />
      );
  }
};
