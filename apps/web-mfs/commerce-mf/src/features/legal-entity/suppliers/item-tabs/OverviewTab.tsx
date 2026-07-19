import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type { SupplierItemDetail } from '@/schemas/suppliers';

interface OverviewTabProps {
  item: SupplierItemDetail;
}

export const OverviewTab = ({ item }: OverviewTabProps) => {
  const schemeLabel =
    item.hasScheme && item.schemeBuyQty && item.schemeFreeQty ? `${item.schemeBuyQty}+${item.schemeFreeQty}` : 'None';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Item Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <DetailField label="Inventory Item" type="string" value={item.inventoryItemName} />
          <DetailField label="Supplier Item Code" type="string" mono value={item.supplierItemCode} />
          <DetailField label="UOM" type="string" mono value={item.uomSymbol} />
          <DetailField label="Current Price" type="currency" value={item.unitPrice} />
          <DetailField label="Min Order Qty" type="number" value={item.minOrderQuantity} />
          <DetailField
            label="Lead Time"
            type="string"
            value={item.leadTimeDays != null ? `${item.leadTimeDays} days` : null}
          />
          <DetailField label="Standing Scheme" type="string" value={schemeLabel} />
          <DetailField
            label="Status"
            type="string"
            value={
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={item.isActive ? 'success' : 'outline'}>{item.isActive ? 'Active' : 'Inactive'}</Badge>
                {item.isPreferred && <Badge variant="success">Preferred</Badge>}
                {item.taxInclusive && <Badge variant="outline">Tax Inclusive</Badge>}
              </div>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};
