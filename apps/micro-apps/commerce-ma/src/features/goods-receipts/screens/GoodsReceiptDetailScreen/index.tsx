import { useRoute } from '@react-navigation/native';
import {
  ScreenHeader,
  type ScreenHeaderTabConfig,
  useScreenHeaderTabContent,
} from '@vritti/quantum-ui-native/ScreenHeader';
import { useMemo } from 'react';
import { useGoodsReceipt } from '../../../../hooks/goods-receipts';
import type { GoodsReceiptDetailParams } from '../../types';
import { ComingSoonTab } from './tabs/ComingSoonTab';
import { OverviewTab } from './tabs/OverviewTab';

const TAB_ICONS = {
  overview: { sfSymbol: 'info.circle', materialSymbol: 'info' },
  breakdown: { sfSymbol: 'square.stack.3d.up', materialSymbol: 'layers' },
  itemsCost: { sfSymbol: 'dollarsign.circle', materialSymbol: 'payments' },
} as const;

// GR detail header — the ScreenHeader tabs variant (mirrors InventoryItemDetailHeader). Reads the GR from
// cache (populated by the feed via the shared fragment) for the title + Overview content. Breakdown and
// Items Cost mirror the web tabs but are ComingSoon placeholders, to be built one by one.
export function GoodsReceiptDetailHeader() {
  const route = useRoute();
  const id = (route.params as GoodsReceiptDetailParams | undefined)?.id;
  const { data } = useGoodsReceipt(id);
  const gr = data?.goodsReceipt;

  const tabs = useMemo<ScreenHeaderTabConfig[]>(() => {
    if (!gr) return [];
    return [
      { id: 'overview', label: 'Overview', icon: TAB_ICONS.overview, content: <OverviewTab gr={gr} /> },
      { id: 'breakdown', label: 'Breakdown', icon: TAB_ICONS.breakdown, content: <ComingSoonTab label="Breakdown" /> },
      { id: 'items-cost', label: 'Items Cost', icon: TAB_ICONS.itemsCost, content: <ComingSoonTab label="Items Cost" /> },
    ];
  }, [gr]);

  if (!gr) return <ScreenHeader title="Goods Receipt" backButton />;
  return <ScreenHeader variant="tabs" title={gr.grNumber} tabs={tabs} backButton />;
}

// Body renders the active tab's content from the per-route registry the header populated.
export function GoodsReceiptDetail() {
  return <>{useScreenHeaderTabContent()}</>;
}
