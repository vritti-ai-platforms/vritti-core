import type React from 'react';
import type { PurchaseDetail, PurchaseItemView } from '@/schemas/purchases';
import type { PurchasesBinding } from '../bindings';
import { PurchaseItemInfoCard } from './PurchaseItemInfoCard';
import { PurchaseItemProgressCard } from './PurchaseItemProgressCard';
import { PurchaseItemSiteStockCard } from './PurchaseItemSiteStockCard';

interface PurchaseItemOverviewTabProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  item: PurchaseItemView;
}

// How far the item has got across the top, then its stock at the purchase's site beside what the item is
export const PurchaseItemOverviewTab: React.FC<PurchaseItemOverviewTabProps> = ({ binding, purchase, item }) => (
  <div className="flex flex-col gap-4">
    <PurchaseItemProgressCard binding={binding} purchase={purchase} item={item} />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <PurchaseItemSiteStockCard binding={binding} purchase={purchase} item={item} />
      <PurchaseItemInfoCard item={item} />
    </div>
  </div>
);
