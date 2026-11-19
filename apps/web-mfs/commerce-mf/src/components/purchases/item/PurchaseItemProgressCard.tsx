import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SegmentedProgressKey } from '@vritti/quantum-ui/SegmentedProgress';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import type React from 'react';
import { useState } from 'react';
import type { PurchaseDetail, PurchaseItemView } from '@/schemas/purchases';
import type { PurchasesBinding } from '../bindings';
import { PURCHASE_PROGRESS } from '../purchaseState';
import { PurchaseItemProgress } from '../tabs/items/PurchaseItemProgress';

interface PurchaseItemProgressCardProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  item: PurchaseItemView;
}

// How far the item has got: the same bar as its row in the Items tab at full width, combined or split by supplier, and
// each stage's quantity beneath it
export const PurchaseItemProgressCard: React.FC<PurchaseItemProgressCardProps> = ({ binding, purchase, item }) => {
  const fmt = useFormatters();
  const { data: progress } = binding.usePurchaseItemProgress(purchase.id, item.id);
  const [bySupplier, setBySupplier] = useState(true);
  const unit = item.primaryUomSymbol;
  const quantity = (value: number) => `${fmt.number(value).primary} ${unit}`.trim();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Progress</CardTitle>
          {progress ? (
            <CardDescription>
              {`${fmt.quantity(progress.display.primaryQty).primary} needed · ${fmt.quantity(progress.display.allocatedPrimaryQty).primary} allocated to ${pluralize('supplier', progress.suppliers.length, true)}`}
            </CardDescription>
          ) : (
            <Skeleton className="h-4 w-56" />
          )}
        </div>
        <StatusSwitch
          checked={bySupplier}
          onCheckedChange={setBySupplier}
          ariaLabel="Split progress by supplier"
          activeLabel="By Supplier"
          inactiveLabel="Combined"
          tone="info"
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {progress ? (
          <PurchaseItemProgress item={{ ...progress, primaryUomSymbol: unit }} bySupplier={bySupplier} />
        ) : (
          <Skeleton className="h-10 w-full" />
        )}
        <SegmentedProgressKey items={PURCHASE_PROGRESS.segments} trackLabel={PURCHASE_PROGRESS.track.label} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <DetailField label="Needed" type="string" value={fmt.quantity(item.display.primaryQty).primary} />
          <DetailField
            label="Not Allocated"
            type="string"
            value={progress && quantity(Math.max(0, progress.primaryQty - progress.allocatedPrimaryQty))}
          />
          <DetailField
            label="Ordered"
            type="string"
            value={progress && fmt.quantity(progress.display.orderedPrimaryQty).primary}
          />
          <DetailField
            label="In Transit"
            type="string"
            value={progress && fmt.quantity(progress.display.inTransitPrimaryQty).primary}
          />
          <DetailField
            label="Received"
            type="string"
            value={progress && fmt.quantity(progress.display.receivedPrimaryQty).primary}
          />
          <DetailField
            label="Invoiced"
            type="string"
            value={progress && fmt.quantity(progress.display.invoicedPrimaryQty).primary}
          />
        </div>
      </CardContent>
    </Card>
  );
};
