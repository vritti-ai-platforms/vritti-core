import type React from 'react';
import type { PurchasesBinding } from './bindings';
import { PurchaseSummaryBadge } from './PurchaseSummaryBadge';

interface PurchaseProgressBadgeProps {
  binding: PurchasesBinding;
  purchaseId: string;
}

// How far an open purchase's items have got as a whole, read from its progress; nothing until it loads
export const PurchaseProgressBadge: React.FC<PurchaseProgressBadgeProps> = ({ binding, purchaseId }) => {
  const { data: progress } = binding.usePurchaseProgress(purchaseId);
  return progress ? <PurchaseSummaryBadge purchase={progress} /> : null;
};
