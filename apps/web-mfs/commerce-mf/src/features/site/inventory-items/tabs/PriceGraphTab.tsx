import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Empty } from '@vritti/quantum-ui/Empty';
import { LineChart as LineChartIcon } from 'lucide-react';
import type React from 'react';
import { ItemSupplierPricesGraph } from '@/components/inventory-items/ItemSupplierPricesGraph';
import { useInventoryItemPriceGraph, useSaveInventoryItemPriceGraph } from '@/hooks/site/inventory-items';

interface PriceGraphTabProps {
  inventoryItemId: string;
}

// The item's price from its suppliers at this site; what it shows is saved per user like a table's state
export const PriceGraphTab: React.FC<PriceGraphTabProps> = ({ inventoryItemId }) => {
  const { data: graph, isLoading } = useInventoryItemPriceGraph(inventoryItemId);
  const save = useSaveInventoryItemPriceGraph(inventoryItemId);

  return (
    <ItemSupplierPricesGraph
      graph={graph}
      isLoading={isLoading}
      onSelectionChange={(selection) => save.mutate(selection)}
      optionsEndpointBase={`commerce-api/site/inventory-items/${inventoryItemId}/prices`}
      mrpPermission={SITE_INVENTORY_ITEMS.mrp.view}
      emptyState={
        <Empty
          icon={<LineChartIcon className="size-6" />}
          title="No prices in this period"
          description="No supplier has a price for this item at this site in the selected dates. Widen the date range."
        />
      }
    />
  );
};
