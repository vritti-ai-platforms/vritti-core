import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { type InventoryItemData, inventoryItemTypeConfig, inventoryTrackingConfig } from '@/schemas/inventory-items';
import { useInventoryItemStocks } from '@/site/hooks/inventory-items';

interface OverviewTabProps {
  item: InventoryItemData;
}

const pickStrategyLabels: Record<string, string> = { none: 'None', fifo: 'FIFO', fefo: 'FEFO' };

export const OverviewTab = ({ item }: OverviewTabProps) => {
  const { data: stocks = [] } = useInventoryItemStocks(item.id);

  const totalStocked = stocks.reduce((sum, row) => sum + row.stockedQuantity, 0);
  const totalReserved = stocks.reduce((sum, row) => sum + row.reservedQuantity, 0);
  const totalAvailable = stocks.reduce((sum, row) => sum + row.availableQuantity, 0);

  return (
    <Card>
      <CardContent className="flex flex-col gap-8 pt-6">
        <div>
          <h3 className="mb-4 text-sm font-semibold">Details</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <DetailField label="Type" type="string" value={inventoryItemTypeConfig[item.type].label} />
            <DetailField label="Category" type="string" value={item.categoryName} />
            <DetailField label="Unit of Measure" type="string" value={item.uomSymbol} />
            <DetailField label="Tracking" type="string" value={inventoryTrackingConfig[item.tracking].label} />
            <DetailField label="Pick Strategy" type="string" value={pickStrategyLabels[item.pickStrategy]} />
            <DetailField label="Purchase Tax Group" type="string" value={item.purchaseTaxGroupName} />
            <DetailField label="HSN Code" type="string" value={item.hsnCode} mono />
            {item.hasMrp && <DetailField label="MRP Unit" type="string" value={item.mrpUomSymbol} />}
            {item.hasMrp && <DetailField label="Default MRP" type="currency" value={item.defaultMrp} />}
            <DetailField label="Description" type="string" value={item.description} className="col-span-full" />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="mb-4 text-sm font-semibold">Stock Summary</h3>
          <div className="grid grid-cols-3 gap-4">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
