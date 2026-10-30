import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type { SupplierItemDetail } from '@/schemas/suppliers';

interface OverviewTabProps {
  item: SupplierItemDetail;
}

export const OverviewTab = ({ item }: OverviewTabProps) => {
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
          <DetailField label="Sites" type="number" value={item.siteCount} />
        </div>
      </CardContent>
    </Card>
  );
};
