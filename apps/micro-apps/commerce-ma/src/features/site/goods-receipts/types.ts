// Detail takes the GR id (not the whole row), so it reads live from the cache. PushNavigator.push is
// param-less, so we use React Navigation's navigate directly (mirrors inventory-items).
export type GoodsReceiptRoute = 'GoodsReceiptsList' | 'GoodsReceiptDetail';

export interface GoodsReceiptDetailParams {
  id: string;
}

export type GoodsReceiptNavigation = {
  navigate: {
    (screen: 'GoodsReceiptDetail', params: GoodsReceiptDetailParams): void;
  };
  goBack: () => void;
};
