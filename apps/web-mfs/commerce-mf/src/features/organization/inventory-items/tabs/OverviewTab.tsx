import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import {
  type InventoryItemData,
  inventoryItemTypeConfig,
  inventoryPickStrategyConfig,
  inventoryTrackingConfig,
} from '@/schemas/inventory-items';

interface OverviewTabProps {
  item: InventoryItemData;
}

export const OverviewTab = ({ item }: OverviewTabProps) => {
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
            <DetailField
              label="Pick Strategy"
              type="string"
              value={inventoryPickStrategyConfig[item.pickStrategy].label}
            />
            <DetailField label="HSN Code" type="string" value={item.hsnCode} mono />
            <DetailField label="Description" type="string" value={item.description} className="col-span-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
