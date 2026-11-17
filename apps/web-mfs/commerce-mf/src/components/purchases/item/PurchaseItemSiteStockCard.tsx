import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import { SiteStockCell } from '@/components/inventory-items/SiteStockCell';
import type { PurchaseDetail, PurchaseItemView } from '@/schemas/purchases';
import { ReplenishmentMethodValues, replenishmentConfig } from '@/schemas/site-items';
import type { PurchasesBinding } from '../bindings';

interface PurchaseItemSiteStockCardProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  item: PurchaseItemView;
}

// The item's stock at the purchase's site: on hand by location against the site's levels, how the site replenishes it
// and, under a reorder point, how much more reaches the maximum once this purchase's open orders arrive
export const PurchaseItemSiteStockCard: React.FC<PurchaseItemSiteStockCardProps> = ({ binding, purchase, item }) => {
  const { data: stock, isLoading } = binding.usePurchaseItemSiteStock(purchase.id, item.id);
  const { data: progress } = binding.usePurchaseItemProgress(purchase.id, item.id);
  const onOrder = progress ? Math.max(0, progress.orderedPrimaryQty - progress.receivedPrimaryQty) : 0;
  const upToMaximum =
    stock?.replenishment === ReplenishmentMethodValues.REORDER_POINT && stock.maxStock !== null
      ? Math.max(0, stock.maxStock - stock.onHand - onOrder)
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{`At ${purchase.siteName}`}</CardTitle>
        <CardDescription>Stock on hand and the site's levels</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : stock ? (
          <>
            <SiteStockCell stock={stock} uomSymbol={item.primaryUomSymbol} />
            <div className="grid grid-cols-2 gap-4">
              <DetailField
                label="Replenishment"
                type="string"
                value={stock.replenishment && replenishmentConfig[stock.replenishment].label}
              />
              <DetailField label="On Order Here" type="number" value={onOrder} />
              {upToMaximum !== null && (
                <DetailField
                  label={`Up to Maximum ${item.primaryUomSymbol}`.trim()}
                  type="number"
                  value={upToMaximum}
                />
              )}
            </div>
          </>
        ) : (
          <Typography variant="body2" intent="muted">
            The site does not carry this item yet.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
