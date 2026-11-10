import { useQueryClient } from '@tanstack/react-query';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { useChart } from '@vritti/quantum-ui/Chart';
import type { ContextStateInstance } from '@vritti/quantum-ui/ContextBar';
import { filter } from '@vritti/quantum-ui/filter';
import { useWorkspaceCurrency, useWorkspaceTimeZone } from '@vritti/quantum-ui/hooks';
import { isoTodayDate } from '@vritti/quantum-ui/timezone';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { ItemSupplierPriceHistory } from '@/components/inventory-items/ItemSupplierPriceHistory';
import {
  INVENTORY_ITEM_PRICE_HISTORY_KEY,
  useInventoryItem,
  useInventoryItemPriceHistoryQuery,
} from '@/hooks/site/inventory-items';
import type { InventoryItemPriceHistory } from '@/schemas/suppliers';
import { defaultPriceRange, selectItemPriceHistory } from '@/utils/supplierPrice';

interface PriceHistoryTabProps {
  inventoryItemId: string;
}

// The item's price from its suppliers at this site, at the context saved in the history's context bar
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
    slug: `commerce-site-inventory-item-${inventoryItemId}-price-history`,
    defaultContext: [
      filter('period').between(defaultRange.from, defaultRange.to),
      filter('uom').equals(item.uomId),
      filter('currency').equals(currency),
    ],
    onStatePush: () => queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_PRICE_HISTORY_KEY(inventoryItemId) }),
  });

  return (
    <ItemSupplierPriceHistory
      inventoryItemId={inventoryItemId}
      chart={chart}
      mrpPermission={SITE_INVENTORY_ITEMS.mrp.view}
      emptyState={{
        title: 'No prices for these filters',
        description:
          'No supplier has a price for this item at this site that matches these filters. Change the filters.',
      }}
    />
  );
};
