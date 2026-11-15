import { Empty } from '@vritti/quantum-ui/Empty';
import { Users } from 'lucide-react';
import type React from 'react';
import type { PurchaseHeader } from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';
import { PurchaseLegCard } from '../../suppliers/PurchaseLegCard';

interface SourcingSuppliersTabProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
}

// A preview of the suppliers sourced from: one card each with its flow, total and what Submit will do for it; nothing
// starts until Submit, so no supplier actions here
export const SourcingSuppliersTab: React.FC<SourcingSuppliersTabProps> = ({ binding, purchase }) => {
  const { data: legs } = binding.usePurchaseSuppliers(purchase.id);
  if (legs.length === 0) {
    return (
      <Empty
        icon={<Users />}
        title="No suppliers yet"
        description="A supplier joins the purchase with its first allocation."
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {legs.map((leg) => (
        <PurchaseLegCard key={leg.id} binding={binding} purchase={purchase} leg={leg} preview readOnly />
      ))}
    </div>
  );
};
