import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Select } from '@vritti/quantum-ui/Select';
import { Store } from 'lucide-react';
import type React from 'react';
import { ItemSupplierPricesGraph } from '@/components/inventory-items/ItemSupplierPricesGraph';
import { useInventoryItemPriceGraph, useSaveInventoryItemPriceGraph } from '@/hooks/legal-entity/inventory-items';

interface PriceGraphTabProps {
  inventoryItemId: string;
}

// The item's price from its suppliers at one site, the site picked from those where it has prices; what it shows is
// saved per user like a table's state
export const PriceGraphTab: React.FC<PriceGraphTabProps> = ({ inventoryItemId }) => {
  const { data: graph, isLoading } = useInventoryItemPriceGraph(inventoryItemId);
  const save = useSaveInventoryItemPriceGraph(inventoryItemId);
  const siteId = graph?.selection.siteId ?? undefined;

  return (
    <ItemSupplierPricesGraph
      graph={graph}
      isLoading={isLoading}
      onSelectionChange={(selection) => save.mutate(selection)}
      optionsEndpointBase={siteId ? `commerce-api/le/inventory-items/${inventoryItemId}/prices/${siteId}` : undefined}
      mrpPermission={LE_INVENTORY_ITEMS.mrp.view}
      filters={
        <div className="w-64">
          <Select
            placeholder="Select site"
            searchable
            clearable={false}
            optionsEndpoint={`commerce-api/le/inventory-items/${inventoryItemId}/prices/sites`}
            fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
            value={siteId}
            onChange={(value: unknown) => {
              if (!graph || !value) return;
              // Suppliers and MRPs belong to a site, so a new site starts from its own defaults
              save.mutate({ ...graph.selection, siteId: String(value), supplierIds: [], mrpIds: [] });
            }}
          />
        </div>
      }
      emptyState={
        <Empty
          icon={<Store className="size-6" />}
          title={siteId ? 'No prices in this period' : 'No prices yet'}
          description={
            siteId
              ? 'No supplier has a price for this item at the selected site in these dates. Widen the date range.'
              : "No supplier has priced this item at any of this legal entity's sites."
          }
        />
      }
    />
  );
};
