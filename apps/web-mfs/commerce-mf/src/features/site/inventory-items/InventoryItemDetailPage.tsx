import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import { Ban } from 'lucide-react';
import { useCallback, useState } from 'react';
import {
  useInventoryItem,
  useInventoryItemCounts,
  useRemoveFromSite,
  useSiteItem,
  useUnblockSiteItem,
} from '@/hooks/site/inventory-items';
import { SiteItemStatusValues } from '@/schemas/site-items';
import { BlockSiteItemForm } from './forms/BlockSiteItemForm';
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
  const { data: counts, isLoading: countsLoading } = useInventoryItemCounts(id);
  const [activeTab, setActiveTab] = useState('overview');
  const { data: siteItem } = useSiteItem(id);
  const removeFromSite = useRemoveFromSite(id);
  const unblockMutation = useUnblockSiteItem();
  const blockDialog = useDialog();
  const confirm = useConfirm();
  const isBlocked = siteItem?.status === SiteItemStatusValues.BLOCKED;

  // Switching purchasing off asks why in a dialog; switching it back on confirms and unblocks
  const handleBlockedChange = useCallback(
    async (blocked: boolean) => {
      if (blocked) {
        blockDialog.open();
        return;
      }
      const confirmed = await confirm({
        title: 'Unblock purchasing?',
        description: `This site can add ${item.name} to purchases and purchase orders again.`,
        confirmLabel: 'Unblock',
      });
      if (confirmed) unblockMutation.mutate(id);
    },
    [blockDialog, confirm, id, item.name, unblockMutation],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.name}
        description={item.description ?? 'No description'}
        titleSlot={
          <div className="flex items-center gap-2">
            <StatusSwitch
              checked={isBlocked}
              onCheckedChange={handleBlockedChange}
              ariaLabel={`Block purchasing of ${item.name} at this site`}
              activeLabel="Purchasing Blocked"
              inactiveLabel="Purchasing Allowed"
              tone="destructive"
              size="md"
              permission={SITE_INVENTORY_ITEMS.setup.block}
              disabled={!siteItem}
              disabledTip="Add the item to this site first."
              isLoading={unblockMutation.isPending}
            />
            {siteItem?.supplierItemsRequired && (
              <Tooltip content="This site buys the item only from suppliers that have it set up here; the legal entity sets this.">
                <Badge variant="info">Supplier items required</Badge>
              </Tooltip>
            )}
          </div>
        }
      />

      {isBlocked && (
        <Alert
          variant="warning"
          title={`Purchasing blocked: ${siteItem.blockedReason}`}
          description="Stock on hand and goods already ordered still move; new purchases of it are refused at this site."
        />
      )}

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
            count: counts?.stockLevelCount,
            countLoading: countsLoading,
            content: <StockLevelsTab inventoryItemId={item.id} uomSymbol={item.uomSymbol} />,
          },
          ...(item.tracking === 'LOT' || item.tracking === 'LOT_SERIAL'
            ? [
                {
                  value: 'lots',
                  label: 'Lots',
                  count: counts?.lotCount,
                  countLoading: countsLoading,
                  content: <LotsTab inventoryItemId={item.id} />,
                },
              ]
            : []),
          {
            value: 'locations',
            label: 'Locations',
            count: counts?.locationCount,
            countLoading: countsLoading,
            permission: SITE_INVENTORY_ITEMS.locations.view,
            content: <LocationsTab inventoryItemId={item.id} />,
          },
          {
            value: 'suppliers',
            label: 'Suppliers',
            count: counts?.supplierCount,
            countLoading: countsLoading,
            content: <SuppliersTab inventoryItemId={item.id} />,
          },
          {
            value: 'prices',
            label: 'Prices',
            count: counts?.priceCount,
            countLoading: countsLoading,
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
            count: counts?.movementCount,
            countLoading: countsLoading,
            content: <LedgerTab inventoryItemId={item.id} uomSymbol={item.uomSymbol} />,
          },
          {
            value: 'quants',
            label: 'Quants',
            count: counts?.quantCount,
            countLoading: countsLoading,
            content: <QuantsTab inventoryItemId={item.id} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <Dialog
        handle={blockDialog}
        icon={Ban}
        title="Block Purchasing"
        description={`This site stops adding ${item.name} to purchases and purchase orders. Stock on hand and goods already ordered still move.`}
        content={(close) => <BlockSiteItemForm inventoryItemId={id} onSuccess={close} onCancel={close} />}
      />

      {siteItem && (
        <DangerZone
          title="Remove from site"
          description="The site stops buying, receiving and stocking this item until it is added again. Not allowed while the site holds stock of it or has it on an open purchase."
          buttonText="Remove from Site"
          confirm={{
            title: 'Remove from this site?',
            description: `This site can no longer buy, receive or stock ${item.name} until it is added again.`,
            confirmLabel: 'Remove',
            variant: 'destructive',
          }}
          onClick={() => removeFromSite.mutate()}
          isLoading={removeFromSite.isPending}
          disabled={removeFromSite.isPending}
          permission={SITE_INVENTORY_ITEMS.setup.delete}
        />
      )}
    </div>
  );
};
