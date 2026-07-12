import { useQuery } from '@apollo/client/react';
import { useRoute } from '@react-navigation/native';
import {
  ScreenHeader,
  type ScreenHeaderTabConfig,
  useScreenHeaderTabContent,
} from '@vritti/quantum-ui-native/ScreenHeader';
import { useMemo } from 'react';
import { INVENTORY_ITEM_QUERY } from '../../../../../graphql/inventory-items';
import { ItemActionsMenu } from '../../components/ItemActionsMenu';
import type { InventoryItemDetailParams, InventoryItemQueryData } from '../../types';
import { ComingSoonTab } from './tabs/ComingSoonTab';
import { LedgerTab } from './tabs/LedgerTab';
import { LocationsTab } from './tabs/LocationsTab';
import { OverviewTab } from './tabs/OverviewTab';
import { QuantsTab } from './tabs/QuantsTab';
import { StockLevelsTab } from './tabs/StockLevelsTab';
import { SuppliersTab } from './tabs/SuppliersTab';
import { UomConversionsTab } from './tabs/UomConversionsTab';

const TAB_ICONS = {
  overview: { sfSymbol: 'info.circle', materialSymbol: 'info' },
  uom: { sfSymbol: 'arrow.left.arrow.right', materialSymbol: 'swap_horiz' },
  stock: { sfSymbol: 'chart.bar', materialSymbol: 'bar_chart' },
  locations: { sfSymbol: 'mappin.and.ellipse', materialSymbol: 'place' },
  suppliers: { sfSymbol: 'shippingbox', materialSymbol: 'local_shipping' },
  lots: { sfSymbol: 'square.stack.3d.up', materialSymbol: 'layers' },
  quants: { sfSymbol: 'cube.box', materialSymbol: 'inventory_2' },
  ledger: { sfSymbol: 'list.bullet.rectangle', materialSymbol: 'receipt_long' },
};

// The detail screen's header renders the ScreenHeader tabs variant. It runs inside the route's
// NavigationRouteContext, so the tab registry keys to the same route.key the body's
// useScreenHeaderTabContent() reads (same mechanism as useScreenSearch). All web tabs are scaffolded;
// only Overview is built today — the rest are ComingSoon placeholders (each is a screen-by-screen
// full-stack slice). Lots shows only for lot-tracked items, mirroring the web.
export function InventoryItemDetailHeader() {
  const route = useRoute();
  const id = (route.params as InventoryItemDetailParams | undefined)?.id;

  // cache-only: the item is already cached from the feed (same InventoryItemFields fragment) — no network.
  const { data } = useQuery<InventoryItemQueryData>(INVENTORY_ITEM_QUERY, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-only',
  });
  const item = data?.inventoryItem;

  const tabs = useMemo<ScreenHeaderTabConfig[]>(() => {
    if (!item) return [];
    const lotTracked = item.tracking === 'lot' || item.tracking === 'lot_serial';
    return [
      { id: 'overview', label: 'Overview', icon: TAB_ICONS.overview, content: <OverviewTab item={item} /> },
      {
        id: 'uom-conversions',
        label: 'UOM Conversions',
        icon: TAB_ICONS.uom,
        content: <UomConversionsTab item={item} />,
      },
      {
        id: 'stock-levels',
        label: 'Stock Levels',
        icon: TAB_ICONS.stock,
        content: <StockLevelsTab item={item} />,
      },
      { id: 'locations', label: 'Locations', icon: TAB_ICONS.locations, content: <LocationsTab item={item} /> },
      { id: 'suppliers', label: 'Suppliers', icon: TAB_ICONS.suppliers, content: <SuppliersTab item={item} /> },
      ...(lotTracked
        ? [{ id: 'lots', label: 'Lots', icon: TAB_ICONS.lots, content: <ComingSoonTab label="Lots" /> }]
        : []),
      { id: 'quants', label: 'Quants', icon: TAB_ICONS.quants, content: <QuantsTab item={item} /> },
      { id: 'ledger', label: 'Ledger', icon: TAB_ICONS.ledger, content: <LedgerTab item={item} /> },
    ];
  }, [item]);

  if (!item) return <ScreenHeader title="Item" backButton />;
  // Centered-title tabs header: built-in back button + an overflow menu (Edit/Delete) on the right.
  return (
    <ScreenHeader
      variant="tabs"
      title={item.name}
      tabs={tabs}
      backButton
      rightActions={<ItemActionsMenu item={item} />}
    />
  );
}

// Body renders the active tab's content (lazy cross-fade) from the per-route registry the header
// populated. Each tab content is self-contained (its own ScreenContainer), driving the header collapse.
export function InventoryItemDetail() {
  return <>{useScreenHeaderTabContent()}</>;
}
