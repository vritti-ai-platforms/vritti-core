import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { useConfirm, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { useCallback, useState } from 'react';
import { useInventoryItem, useItemStockLevels, useRemoveStockLevels } from '@/hooks/site/inventory-items';
import { LedgerTab } from './tabs/LedgerTab';
import { LotsTab } from './tabs/LotsTab';
import { LocationsTab } from './tabs/locations/LocationsTab';
import { OverviewTab } from './tabs/OverviewTab';
import { PriceHistoryTab } from './tabs/PriceHistoryTab';
import { PricesTab } from './tabs/PricesTab';
import { QuantsTab } from './tabs/QuantsTab';
import { StockLevelsTab } from './tabs/StockLevelsTab';
import { SuppliersTab } from './tabs/SuppliersTab';

export const InventoryItemDetailPage = () => {
  const { id } = useSlugParams('itemSlug');
  const { data: item } = useInventoryItem(id);
  const [activeTab, setActiveTab] = useState('overview');
  const { data: stockLevels } = useItemStockLevels(id);
  const removeStockLevels = useRemoveStockLevels(id);
  const confirm = useConfirm();

  const handleRemoveStockLevels = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Remove stock levels at this site?',
      description: `This site can no longer buy, receive or stock ${item.name} until stock levels are set again.`,
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeStockLevels.mutate();
  }, [confirm, item.name, removeStockLevels]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={item.name} description={item.description ?? 'No description'} />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: <OverviewTab item={item} />,
          },
          {
            value: 'stock-levels',
            label: 'Stock',
            content: <StockLevelsTab inventoryItemId={item.id} uomSymbol={item.uomSymbol} />,
          },
          ...(item.tracking === 'LOT' || item.tracking === 'LOT_SERIAL'
            ? [
                {
                  value: 'lots',
                  label: 'Lots',
                  content: <LotsTab inventoryItemId={item.id} uomSymbol={item.uomSymbol} />,
                },
              ]
            : []),
          {
            value: 'locations',
            label: 'Locations',
            permission: SITE_INVENTORY_ITEMS.locations.view,
            content: <LocationsTab inventoryItemId={item.id} />,
          },
          {
            value: 'suppliers',
            label: 'Suppliers',
            content: <SuppliersTab inventoryItemId={item.id} />,
          },
          {
            value: 'prices',
            label: 'Prices',
            permission: SITE_INVENTORY_ITEMS.prices.view,
            content: <PricesTab inventoryItemId={item.id} />,
          },
          {
            value: 'price-history',
            label: 'Price History',
            permission: SITE_INVENTORY_ITEMS.prices.view,
            content: <PriceHistoryTab inventoryItemId={item.id} />,
          },
          {
            value: 'movements',
            label: 'Movements',
            content: <LedgerTab inventoryItemId={item.id} uomSymbol={item.uomSymbol} />,
          },
          {
            value: 'quants',
            label: 'Quants',
            content: <QuantsTab inventoryItemId={item.id} uomSymbol={item.uomSymbol} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      {stockLevels && (
        <DangerZone
          title="Remove stock levels"
          description="The site stops buying, receiving and stocking this item until its stock levels are set again. Not allowed while the site holds stock of it or has it on an open purchase."
          buttonText="Remove Stock Levels"
          onClick={handleRemoveStockLevels}
          isLoading={removeStockLevels.isPending}
          disabled={removeStockLevels.isPending}
          permission={SITE_INVENTORY_ITEMS.stockLevels.delete}
        />
      )}
    </div>
  );
};
