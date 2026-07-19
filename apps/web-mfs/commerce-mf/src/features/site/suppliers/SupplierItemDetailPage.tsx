import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { useState } from 'react';
import { useSiteSupplier, useSiteSupplierItem } from '@/hooks/site/suppliers';
import { OverviewTab } from './item-tabs/OverviewTab';
import { PricesTab } from './item-tabs/PricesTab';

export const SupplierItemDetailPage = () => {
  const { id: supplierId } = useSlugParams('supplierSlug');
  const { id: itemId } = useSlugParams('itemSlug');
  const { data: supplier } = useSiteSupplier(supplierId);
  const { data: item } = useSiteSupplierItem(supplierId, itemId);
  const [activeTab, setActiveTab] = useState('overview');

  const schemeLabel =
    item.hasScheme && item.schemeBuyQty && item.schemeFreeQty ? `${item.schemeBuyQty}+${item.schemeFreeQty}` : 'None';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={item.inventoryItemName} description={supplier.code} />

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
            permission: SITE_SUPPLIERS.items.view,
            content: <OverviewTab item={item} />,
          },
          {
            value: 'prices',
            label: 'Prices',
            permission: SITE_SUPPLIERS.prices.view,
            content: <PricesTab supplierId={supplierId} itemId={itemId} currencyCode={supplier.currencyCode} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />
    </div>
  );
};
