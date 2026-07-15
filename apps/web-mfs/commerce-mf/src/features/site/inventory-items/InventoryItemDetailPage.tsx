import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { useState } from 'react';
import { useInventoryItem } from '@/hooks/site/inventory-items';
import { LedgerTab } from './tabs/LedgerTab';
import { LocationsTab } from './tabs/LocationsTab';
import { LotsTab } from './tabs/LotsTab';
import { OverviewTab } from './tabs/OverviewTab';
import { QuantsTab } from './tabs/QuantsTab';
import { ReorderTab } from './tabs/ReorderTab';
import { StockLevelsTab } from './tabs/StockLevelsTab';
import { SuppliersTab } from './tabs/SuppliersTab';

export const InventoryItemDetailPage = () => {
  const { id } = useSlugParams('itemSlug');
  const { data: item } = useInventoryItem(id);
  const [activeTab, setActiveTab] = useState('overview');

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
          ...(item.tracking === 'lot' || item.tracking === 'lot_serial'
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
            content: <LocationsTab inventoryItemId={item.id} uomSymbol={item.uomSymbol} />,
          },
          {
            value: 'reorder',
            label: 'Reorder',
            content: <ReorderTab item={item} />,
          },
          {
            value: 'suppliers',
            label: 'Suppliers',
            content: <SuppliersTab inventoryItemId={item.id} />,
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
    </div>
  );
};
