import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { SegmentedProgress, SegmentedProgressKey } from '@vritti/quantum-ui/SegmentedProgress';
import { Users } from 'lucide-react';
import type React from 'react';
import { type PurchaseHeader } from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';
import { PURCHASE_PROGRESS, purchaseProgressCaption } from '../../purchaseState';
import { PurchaseLegCard } from '../../suppliers/PurchaseLegCard';

interface ProcuringViewProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  readOnly: boolean;
}

// The Procuring stage: how far the purchase's items have come, and each supplier on its own flow with its documents
// and the actions its step offers
export const ProcuringView: React.FC<ProcuringViewProps> = ({ binding, purchase, readOnly }) => {
  const fmt = useFormatters();
  const { data: legs } = binding.usePurchaseSuppliers(purchase.id);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>{purchaseProgressCaption(purchase.progress, fmt)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <SegmentedProgress
            trackLabel={PURCHASE_PROGRESS.track.label}
            segments={PURCHASE_PROGRESS.segments.map(({ key, label }) => ({
              key,
              label,
              value: purchase.progress.segments[key],
            }))}
          />
          <SegmentedProgressKey items={PURCHASE_PROGRESS.segments} trackLabel={PURCHASE_PROGRESS.track.label} />
        </CardContent>
      </Card>
      {legs.length === 0 ? (
        <Empty icon={<Users />} title="No suppliers" description="Every supplier of this purchase was removed." />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {legs.map((leg) => (
            <PurchaseLegCard key={leg.id} binding={binding} purchase={purchase} leg={leg} readOnly={readOnly} />
          ))}
        </div>
      )}
    </div>
  );
};
