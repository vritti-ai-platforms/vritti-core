import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { OverviewTab } from '@/features/organization/inventory-items/tabs/OverviewTab';
import { useInventoryItem } from '@/hooks/legal-entity/inventory-items';
import { MrpTab } from './tabs/MrpTab';
import { PriceGraphTab } from './tabs/PriceGraphTab';
import { PricesTableTab } from './tabs/PricesTableTab';
import { SuppliersTab } from './tabs/SuppliersTab';

// A master item as a legal entity sees it: read-only details, the legal entity's suppliers for it, their prices at a
// site, and its MRPs
export const InventoryItemDetailPage = () => {
  const { id } = useSlugParams('itemSlug');
  const { data: item } = useInventoryItem(id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={item.name} description={item.sku ?? item.description ?? undefined} />

      <Tabs
        routeParam="tab"
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: LE_INVENTORY_ITEMS.view,
            content: <OverviewTab item={item} />,
          },
          {
            value: 'suppliers',
            label: 'Suppliers',
            permission: LE_INVENTORY_ITEMS.view,
            content: <SuppliersTab inventoryItemId={item.id} />,
          },
          {
            value: 'prices',
            label: 'Prices Table',
            permission: LE_INVENTORY_ITEMS.prices.view,
            content: (
              <PricesTableTab inventoryItemId={item.id} itemName={item.name} uomSymbol={item.uomSymbol ?? null} />
            ),
          },
          {
            value: 'price-graph',
            label: 'Prices Graph',
            permission: LE_INVENTORY_ITEMS.prices.view,
            content: <PriceGraphTab inventoryItemId={item.id} />,
          },
          {
            value: 'mrp',
            label: 'MRP',
            permission: LE_INVENTORY_ITEMS.mrp.view,
            content: <MrpTab inventoryItemId={item.id} />,
          },
        ]}
      />
    </div>
  );
};
