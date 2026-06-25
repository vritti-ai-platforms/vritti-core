import { useQuery } from "@apollo/client/react";
import { useRoute } from "@react-navigation/native";
import {
  ScreenHeader,
  type ScreenHeaderTabConfig,
  useScreenHeaderTabContent,
} from "@vritti/quantum-ui-native/ScreenHeader";
import { useMemo } from "react";
import { INVENTORY_ITEM_QUERY } from "../../../../graphql/inventory-items";
import { ComingSoonTab } from "./tabs/ComingSoonTab";
import { OverviewTab } from "./tabs/OverviewTab";
import type { InventoryItemDetailParams, InventoryItemQueryData } from "../../types";

const TAB_ICONS = {
  overview: { sfSymbol: "info.circle", materialIcon: "info" },
  uom: { sfSymbol: "arrow.left.arrow.right", materialIcon: "swap-horiz" },
  stock: { sfSymbol: "chart.bar", materialIcon: "bar-chart" },
  locations: { sfSymbol: "mappin.and.ellipse", materialIcon: "place" },
  suppliers: { sfSymbol: "shippingbox", materialIcon: "local-shipping" },
  lots: { sfSymbol: "square.stack.3d.up", materialIcon: "layers" },
  quants: { sfSymbol: "cube.box", materialIcon: "inventory-2" },
  ledger: { sfSymbol: "list.bullet.rectangle", materialIcon: "receipt-long" },
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
    fetchPolicy: "cache-only",
  });
  const item = data?.inventoryItem;

  const tabs = useMemo<ScreenHeaderTabConfig[]>(() => {
    if (!item) return [];
    const lotTracked = item.tracking === "lot" || item.tracking === "lot_serial";
    return [
      { id: "overview", label: "Overview", icon: TAB_ICONS.overview, content: <OverviewTab item={item} /> },
      { id: "uom-conversions", label: "UOM Conversions", icon: TAB_ICONS.uom, content: <ComingSoonTab label="UOM Conversions" /> },
      { id: "stock-levels", label: "Stock Levels", icon: TAB_ICONS.stock, content: <ComingSoonTab label="Stock Levels" /> },
      { id: "locations", label: "Locations", icon: TAB_ICONS.locations, content: <ComingSoonTab label="Locations" /> },
      { id: "suppliers", label: "Suppliers", icon: TAB_ICONS.suppliers, content: <ComingSoonTab label="Suppliers" /> },
      ...(lotTracked
        ? [{ id: "lots", label: "Lots", icon: TAB_ICONS.lots, content: <ComingSoonTab label="Lots" /> }]
        : []),
      { id: "quants", label: "Quants", icon: TAB_ICONS.quants, content: <ComingSoonTab label="Quants" /> },
      { id: "ledger", label: "Ledger", icon: TAB_ICONS.ledger, content: <ComingSoonTab label="Ledger" /> },
    ];
  }, [item]);

  if (!item) return <ScreenHeader title="Item" />;
  return <ScreenHeader variant="tabs" title={item.name} subtitle={item.code} tabs={tabs} />;
}

// Body renders the active tab's content (lazy cross-fade) from the per-route registry the header
// populated. Each tab content is self-contained (its own ScreenContainer), driving the header collapse.
export function InventoryItemDetail() {
  return <>{useScreenHeaderTabContent()}</>;
}
