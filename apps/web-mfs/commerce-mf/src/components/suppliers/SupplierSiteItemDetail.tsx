import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil, Truck } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { SupplierSiteBinding } from './bindings';
import { EditItemTermsDialog } from './forms/EditItemTermsDialog';
import { OverviewTab } from './item-tabs/OverviewTab';
import { PriceGraph } from './item-tabs/PriceGraph';
import { PricesTab } from './item-tabs/PricesTab';

interface SupplierSiteItemDetailProps {
  binding: SupplierSiteBinding;
}

// One supplier item at one site: its terms and price history there, and its price timeline
export const SupplierSiteItemDetail: React.FC<SupplierSiteItemDetailProps> = ({ binding }) => {
  const supplierRef = binding.useSupplierRef();
  const [activeTab, setActiveTab] = useState('overview');
  const itemId = binding.useItemId();
  const { data: item } = binding.useSiteItem(supplierRef, itemId);
  const termsDialog = useDialog();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.inventoryItemName}
        description={item.supplierCode}
        titleSlot={
          <div className="flex items-center gap-2">
            {!item.itemSiteId && <Badge variant="outline">Not Set Up Here</Badge>}
            {item.isPreferred && <Badge variant="success">Preferred</Badge>}
          </div>
        }
        actions={
          item.itemSiteId ? (
            <Button
              variant="outline"
              size="sm"
              permission={binding.permissions.items.edit}
              startAdornment={<Pencil className="size-4" />}
              onClick={termsDialog.open}
            >
              Edit Site Terms
            </Button>
          ) : undefined
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: binding.permissions.items.view,
            content: <OverviewTab item={item} />,
          },
          {
            value: 'prices',
            label: 'Prices',
            permission: binding.permissions.prices.view,
            content: (
              <PricesTab
                binding={binding}
                supplierRef={supplierRef}
                itemId={itemId}
                inventoryItemId={item.inventoryItemId}
                uomId={item.uomId}
                currencyCode={item.supplierCurrencyCode}
                currencyCodes={item.supplierCurrencyCodes}
                isSetUp={!!item.itemSiteId}
              />
            ),
          },
          {
            value: 'price-graph',
            label: 'Price Graph',
            permission: binding.permissions.prices.view,
            content: <PriceGraph binding={binding} supplierRef={supplierRef} itemId={itemId} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      {item.itemSiteId && (
        <Dialog
          handle={termsDialog}
          icon={Truck}
          title="Edit Site Terms"
          description="Update how this site buys the item from this supplier."
          content={(close) => (
            <EditItemTermsDialog
              binding={binding}
              supplierRef={supplierRef}
              itemId={itemId}
              rowId={item.itemSiteId ?? ''}
              terms={item}
              onSuccess={close}
              onCancel={close}
            />
          )}
        />
      )}
    </div>
  );
};
