import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { useInventoryItemStocks } from '@/hooks/inventory-items';
import { type InventoryItemData, inventoryItemTypeConfig, inventoryTrackingConfig } from '@/schemas/inventory-items';

interface OverviewTabProps {
  item: InventoryItemData;
}

export const OverviewTab = ({ item }: OverviewTabProps) => {
  const { data: stocks = [] } = useInventoryItemStocks(item.id);

  const totalStocked = stocks.reduce((sum, row) => sum + row.stockedQuantity, 0);
  const totalReserved = stocks.reduce((sum, row) => sum + row.reservedQuantity, 0);
  const totalAvailable = stocks.reduce((sum, row) => sum + row.availableQuantity, 0);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <DetailField label="Type" type="string" value={inventoryItemTypeConfig[item.type].label} />
          <DetailField label="Category" type="string" value={item.categoryName} />
          <DetailField label="Unit of Measure" type="string" value={item.uomSymbol} />
          <DetailField label="Tracking" type="string" value={inventoryTrackingConfig[item.tracking].label} />
          <DetailField label="Purchase Tax Group" type="string" value={item.purchaseTaxGroupName} />
          <DetailField label="HSN Code" type="string" value={item.hsnCode} mono />
          <DetailField label="Description" type="string" value={item.description} className="col-span-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <DetailField
            label="Total Stocked"
            type="string"
            mono
            value={
              <>
                {totalStocked} <span className="text-sm font-normal text-muted-foreground">{item.uomSymbol}</span>
              </>
            }
          />
          <DetailField
            label="Total Reserved"
            type="string"
            mono
            value={
              <>
                {totalReserved} <span className="text-sm font-normal text-muted-foreground">{item.uomSymbol}</span>
              </>
            }
          />
          <DetailField
            label="Total Available"
            type="string"
            mono
            value={
              <span className="text-success">
                {totalAvailable} <span className="text-sm font-normal">{item.uomSymbol}</span>
              </span>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};
