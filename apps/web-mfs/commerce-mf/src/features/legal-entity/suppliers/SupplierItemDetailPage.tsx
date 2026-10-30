import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Package, Pencil } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupplierItem, useUnlinkSupplierItem } from '@/hooks/legal-entity/suppliers';
import { UpdateSupplierItemDialog } from './forms/UpdateSupplierItemDialog';
import { AddItemPriceAction } from './item-tabs/AddItemPriceAction';
import { ItemSitesTab } from './item-tabs/ItemSitesTab';
import { OverviewTab } from './item-tabs/OverviewTab';
import { PricesGraphTab } from './item-tabs/PricesGraphTab';
import { PricesTableTab } from './item-tabs/PricesTableTab';

export const SupplierItemDetailPage = () => {
  const { id: supplierId } = useSlugParams('supplierSlug');
  const { id: itemId } = useSlugParams('detail');
  const { data: item } = useSupplierItem(supplierId, itemId);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const editDialog = useDialog();
  // The item page sits at …/<supplier>/<item>/<tab>; deleting returns to the supplier's Items tab
  const deleteMutation = useUnlinkSupplierItem(supplierId, {
    onSuccess: () => navigate('../../items', { relative: 'path' }),
  });

  const handleDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: `Delete "${item.inventoryItemName}" (${item.uomSymbol}) from this supplier?`,
      description: 'Its setup at every site and its price history are deleted too. The inventory item itself is kept.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(item.id);
  }, [confirm, deleteMutation, item]);
  const addPrice = (
    <AddItemPriceAction
      supplierId={supplierId}
      itemId={itemId}
      inventoryItemId={item.inventoryItemId}
      uomId={item.uomId}
      currencyCode={item.supplierCurrencyCode}
      currencyCodes={item.supplierCurrencyCodes}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.inventoryItemName}
        description={item.supplierCode}
        actions={
          <Button
            variant="outline"
            size="sm"
            permission={LE_SUPPLIERS.items.edit}
            startAdornment={<Pencil className="size-4" />}
            onClick={editDialog.open}
          >
            Edit Item
          </Button>
        }
      />

      <Tabs
        routeParam="subDetail"
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: LE_SUPPLIERS.items.view,
            content: <OverviewTab item={item} />,
          },
          {
            value: 'sites',
            label: 'Sites',
            permission: LE_SUPPLIERS.sites.items.view,
            content: <ItemSitesTab supplierId={supplierId} itemId={itemId} />,
          },
          {
            value: 'prices',
            label: 'Prices',
            permission: LE_SUPPLIERS.items.prices.view,
            content: (
              <PricesTableTab
                supplierId={supplierId}
                itemId={itemId}
                inventoryItemId={item.inventoryItemId}
                uomId={item.uomId}
                currencyCodes={item.supplierCurrencyCodes}
                addButton={addPrice}
              />
            ),
          },
          {
            value: 'price-graph',
            label: 'Price Graph',
            permission: LE_SUPPLIERS.items.prices.view,
            content: (
              <PricesGraphTab
                supplierId={supplierId}
                itemId={itemId}
                currencyCode={item.supplierCurrencyCode}
                addButton={addPrice}
              />
            ),
          },
        ]}
      />

      <Dialog
        handle={editDialog}
        icon={Package}
        title="Edit Supplier Item"
        description="Update the supplier's code, unit, minimum order and lead time for this item."
        content={(close) => (
          <UpdateSupplierItemDialog
            supplierId={supplierId}
            item={item}
            unitLocked={item.priceCount > 0}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      <DangerZone
        title="Delete this supplier item"
        description="Its setup at every site and its price history are deleted too. The inventory item itself is kept."
        buttonText="Delete Item"
        permission={LE_SUPPLIERS.items.delete}
        onClick={handleDelete}
        isLoading={deleteMutation.isPending}
        disabled={!item.canDelete || deleteMutation.isPending}
        warning={`This item has ${pluralize('price', item.priceCount, true)} across ${pluralize('site', item.pricedSiteCount, true)}. Price history is kept, so only an item that was never priced can be deleted.`}
        showWarning={!item.canDelete}
      />
    </div>
  );
};
