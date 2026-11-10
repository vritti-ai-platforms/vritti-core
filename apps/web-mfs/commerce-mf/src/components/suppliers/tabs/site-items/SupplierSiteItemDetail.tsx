import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil, Truck } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { SupplierEnrollmentBinding, SupplierSiteItemPageBinding } from '../../bindings';
import { PriceHistory } from '../../PriceHistory';
import { PricesTable } from '../../PricesTable';
import { AddSitePriceAction } from './AddSitePriceAction';
import { EditSupplierSiteItemTermsDialog } from './forms/EditSupplierSiteItemTermsDialog';
import { OverviewTab } from './tabs/OverviewTab';

interface SupplierSiteItemDetailProps {
  binding: SupplierEnrollmentBinding;
  siteItemPage: SupplierSiteItemPageBinding;
}

// One supplier item at the workspace's site: its terms and price history there, and its price timeline
export const SupplierSiteItemDetail: React.FC<SupplierSiteItemDetailProps> = ({ binding, siteItemPage }) => {
  const supplierRef = binding.useEnrollmentRef();
  const [activeTab, setActiveTab] = useState('overview');
  const itemId = siteItemPage.useItemId();
  const { data: item } = siteItemPage.useSiteItem(supplierRef.supplierId, itemId);
  const termsDialog = useDialog();
  const addPrice = (
    <AddSitePriceAction
      siteItemPage={siteItemPage}
      supplierId={supplierRef.supplierId}
      itemId={itemId}
      inventoryItemId={item.inventoryItemId}
      uomId={item.uomId}
      currencyCode={item.supplierCurrencyCode}
      currencyCodes={item.supplierCurrencyCodes}
      isSetUp={!!item.supplierSiteItemId}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.inventoryItemName}
        description={item.supplierCode}
        titleSlot={
          <div className="flex items-center gap-2">
            {!item.supplierSiteItemId && <Badge variant="outline">Not Set Up Here</Badge>}
            {item.isPreferred && <Badge variant="success">Preferred</Badge>}
          </div>
        }
        actions={
          item.supplierSiteItemId ? (
            <Button
              variant="outline"
              size="sm"
              permission={siteItemPage.permissions.editTerms}
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
            permission: binding.permissions.siteItems.view,
            content: <OverviewTab item={item} />,
          },
          {
            value: 'prices',
            label: 'Prices',
            permission: siteItemPage.prices.permissions.view,
            content: (
              <PricesTable
                prices={siteItemPage.prices}
                supplierId={supplierRef.supplierId}
                itemId={itemId}
                inventoryItemId={item.inventoryItemId}
                uomId={item.uomId}
                currencyCodes={item.supplierCurrencyCodes}
                siteId={supplierRef.siteId}
                addAction={addPrice}
              />
            ),
          },
          {
            value: 'price-history',
            label: 'Price History',
            permission: siteItemPage.prices.permissions.view,
            content: (
              <PriceHistory
                prices={siteItemPage.prices}
                supplierId={supplierRef.supplierId}
                itemId={itemId}
                currencyCode={item.supplierCurrencyCode}
                siteId={supplierRef.siteId}
              />
            ),
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      {item.supplierSiteItemId && (
        <Dialog
          handle={termsDialog}
          icon={Truck}
          title="Edit Site Terms"
          description="Update how this site buys the item from this supplier."
          content={(close) => (
            <EditSupplierSiteItemTermsDialog
              useUpdateTerms={siteItemPage.useUpdateSiteItem}
              supplierId={supplierRef.supplierId}
              itemId={itemId}
              supplierSiteItemId={item.supplierSiteItemId ?? ''}
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
