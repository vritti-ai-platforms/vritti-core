import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { useState } from 'react';
import { useSupplierItem } from '@/hooks/legal-entity/suppliers';
import { ItemSitesTab } from './item-tabs/ItemSitesTab';
import { OverviewTab } from './item-tabs/OverviewTab';
import { PricesTab } from './item-tabs/PricesTab';

export const SupplierItemDetailPage = () => {
  const { id: supplierId } = useSlugParams('supplierSlug');
  const { id: itemId } = useSlugParams('itemSlug');
  const { data: item } = useSupplierItem(supplierId, itemId);
  const [activeTab, setActiveTab] = useState('overview');

  const schemeLabel =
    item.hasScheme && item.schemeBuyQty && item.schemeFreeQty ? `${item.schemeBuyQty}+${item.schemeFreeQty}` : 'None';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={item.inventoryItemName} description={item.supplierCode} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DetailField label="Current Price" type="currency" value={item.unitPrice} />
        <DetailField label="UOM" type="string" mono value={item.uomSymbol} />
        <DetailField label="Standing Scheme" type="string" value={schemeLabel} />
        <DetailField label="Min Order" type="number" value={item.minOrderQuantity} />
      </div>

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: LE_SUPPLIERS.items.view,
            content: <OverviewTab item={item} />,
          },
          {
            value: 'prices',
            label: 'Prices',
            permission: LE_SUPPLIERS.prices.view,
            content: <PricesTab supplierId={supplierId} itemId={itemId} currencyCode={item.supplierCurrencyCode} />,
          },
          {
            value: 'sites',
            label: 'Sites',
            permission: LE_SUPPLIERS.items.view,
            content: (
              <ItemSitesTab
                supplierId={supplierId}
                itemId={itemId}
                standingLeadTimeDays={item.leadTimeDays}
                standingMinOrderQuantity={item.minOrderQuantity}
              />
            ),
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />
    </div>
  );
};
