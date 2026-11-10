import { useQueryClient } from '@tanstack/react-query';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { useChart } from '@vritti/quantum-ui/Chart';
import type { ContextStateInstance } from '@vritti/quantum-ui/ContextBar';
import { filter } from '@vritti/quantum-ui/filter';
import { useWorkspaceCurrency, useWorkspaceTimeZone } from '@vritti/quantum-ui/hooks';
import { isoTodayDate } from '@vritti/quantum-ui/timezone';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { ItemSupplierPriceHistory } from '@/components/inventory-items/ItemSupplierPriceHistory';
import {
  LE_INVENTORY_ITEM_PRICE_HISTORY_KEY,
  useInventoryItem,
  useInventoryItemPriceHistoryQuery,
} from '@/hooks/legal-entity/inventory-items';
import type { InventoryItemPriceHistory } from '@/schemas/suppliers';
import { EnrolledSiteFilter } from '@/selectors/enrolled-site';
import { defaultPriceRange, selectItemPriceHistory } from '@/utils/supplierPrice';

interface PriceHistoryTabProps {
  inventoryItemId: string;
}

const RESETS = { site: ['supplierIds', 'mrpIds'] };

// The item's price from its suppliers at one site, picked from those its suppliers are enrolled at — the first until one
// is saved in the history's context bar
export const PriceHistoryTab: React.FC<PriceHistoryTabProps> = ({ inventoryItemId }) => {
  const queryClient = useQueryClient();
  const { data: item } = useInventoryItem(inventoryItemId);
  const historyQuery = useInventoryItemPriceHistoryQuery(inventoryItemId);
  const today = isoTodayDate(useWorkspaceTimeZone());
  const currency = useWorkspaceCurrency();
  const defaultRange = useMemo(() => defaultPriceRange(today), [today]);

  const select = useCallback(
    (data: InventoryItemPriceHistory, context: ContextStateInstance) => selectItemPriceHistory(data, context, today),
    [today],
  );
  const chart = useChart({
    query: historyQuery,
    select,
    slug: `commerce-le-inventory-item-${inventoryItemId}-price-history`,
    defaultContext: [
      filter('period').between(defaultRange.from, defaultRange.to),
      filter('uom').equals(item.uomId),
      filter('currency').equals(currency),
    ],
    resets: RESETS,
    onStatePush: () =>
      queryClient.invalidateQueries({ queryKey: LE_INVENTORY_ITEM_PRICE_HISTORY_KEY(inventoryItemId) }),
  });
  const siteId = chart.context.contextValue('site');

  return (
    <ItemSupplierPriceHistory
      inventoryItemId={inventoryItemId}
      chart={chart}
      mrpPermission={LE_INVENTORY_ITEMS.mrp.view}
      siteFilter={
        <EnrolledSiteFilter
          name="site"
          label="Site"
          mode="context"
          inventoryItemId={inventoryItemId}
          clearable={false}
          selectFirst
        />
      }
      emptyState={{
        title: siteId ? 'No prices for these filters' : 'No prices yet',
        description: siteId
          ? 'No supplier has a price for this item at the selected site that matches these filters. Change the filters.'
          : "None of this item's suppliers is enrolled at any of this legal entity's sites.",
      }}
    />
  );
};
