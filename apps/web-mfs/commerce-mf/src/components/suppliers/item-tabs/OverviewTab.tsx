import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type React from 'react';
import type { SiteSupplierItemDetail } from '@/schemas/suppliers';

interface OverviewTabProps {
  item: SiteSupplierItemDetail;
}

// The supplier item's terms at the site and the price in force there
export const OverviewTab: React.FC<OverviewTabProps> = ({ item }) => {
  const schemeLabel =
    item.hasScheme && item.schemeBuyQty && item.schemeFreeQty ? `${item.schemeBuyQty}+${item.schemeFreeQty}` : 'None';

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <DetailField label="Inventory Item" type="string" value={item.inventoryItemName} />
            <DetailField label="Supplier Item Code" type="string" mono value={item.supplierItemCode} />
            <DetailField label="UOM" type="string" mono value={item.uomSymbol} />
            <DetailField label="Price in Force" type="currency" value={item.unitPrice} />
            <DetailField label="Scheme" type="string" value={schemeLabel} />
            <DetailField label="Tax" type="string" value={item.taxInclusive ? 'Inclusive' : 'Exclusive'} />
            <DetailField label="Min Order Qty" type="number" value={item.minOrderQuantity} />
            <DetailField
              label="Lead Time"
              type="string"
              value={item.leadTimeDays != null ? `${item.leadTimeDays} days` : null}
            />
            {item.itemSiteId && (
              <DetailField
                label="Lead Time Source"
                type="string"
                value={
                  item.isLeadTimeOverridden ? (
                    <Badge variant="outline">Set for this site</Badge>
                  ) : (
                    <Badge variant="secondary">Follows the supplier item</Badge>
                  )
                }
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
