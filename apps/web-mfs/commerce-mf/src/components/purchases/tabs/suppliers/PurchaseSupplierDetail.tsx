import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import type React from 'react';
import { type PurchaseDetail, PurchaseStatusValues } from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';
import { PurchaseLegCard } from '../../suppliers/PurchaseLegCard';

interface PurchaseSupplierDetailProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  legId: string;
}

// One supplier of the purchase opened from its row, with its flow, documents and the actions its step offers
export const PurchaseSupplierDetail: React.FC<PurchaseSupplierDetailProps> = ({ binding, purchase, legId }) => {
  const { data: leg, isLoading } = binding.usePurchaseSupplier(purchase.id, legId);
  if (isLoading || !leg) return <Skeleton className="h-64 w-full" />;
  return (
    <PurchaseLegCard
      binding={binding}
      purchase={purchase}
      leg={leg}
      readOnly={purchase.status !== PurchaseStatusValues.OPEN}
    />
  );
};
