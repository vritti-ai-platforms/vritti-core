import { PushNavigator, type PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { ScreenHeader } from '@vritti/quantum-ui-native/ScreenHeader';
// Side-effect: registers this feature's Apollo cache policies (goodsReceiptsFeed relay + goodsReceipt read
// redirect) at module eval, before any screen here mounts or queries.
import './cache';
import { GoodsReceiptDetail, GoodsReceiptDetailHeader } from './screens/GoodsReceiptDetailScreen';
import { GoodsReceiptsList } from './screens/GoodsReceiptsListScreen';
import type { GoodsReceiptRoute } from './types';

const screens: ReadonlyArray<PushScreenConfig<GoodsReceiptRoute>> = [
  {
    name: 'GoodsReceiptsList',
    component: GoodsReceiptsList,
    header: () => (
      <ScreenHeader
        title="Goods Receipts"
        subtitle="Received stock"
        searchable
        searchPlaceholder="Search GR #, supplier, PO"
      />
    ),
  },
  {
    name: 'GoodsReceiptDetail',
    component: GoodsReceiptDetail,
    header: () => <GoodsReceiptDetailHeader />,
  },
];

export default function GoodsReceiptsScreen() {
  return <PushNavigator<GoodsReceiptRoute> initialRoute="GoodsReceiptsList" screens={screens} />;
}
