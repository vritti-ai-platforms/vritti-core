import { Empty } from '@vritti/quantum-ui/Empty';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Boxes } from 'lucide-react';
import type React from 'react';
import type { GoodsReceiptsBinding } from '../../bindings';
import type { TreeSelection } from '../../types';
import { ItemDetailPanel } from './ItemDetailPanel';
import { LineDetailPanel } from './LineDetailPanel';
import { LotDetailPanel } from './LotDetailPanel';

interface BreakdownDetailsProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  isDraft: boolean;
  selection: TreeSelection | null;
  onSelectionChange: (selection: TreeSelection | null) => void;
}

// The details column of the breakdown, by the kind of node picked; each panel owns its own fetch and skeleton
export const BreakdownDetails: React.FC<BreakdownDetailsProps> = ({ selection, ...props }) => {
  switch (selection?.kind) {
    case 'item':
      return <ItemDetailPanel {...props} selection={selection} />;
    case 'lot':
      return <LotDetailPanel {...props} selection={selection} />;
    case 'line':
      return <LineDetailPanel {...props} selection={selection} />;
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
