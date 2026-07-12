import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { getGoodsReceiptInventoryItemIds } from '@/site/services/goods-receipts.service';
import { GOODS_RECEIPT_INVENTORY_ITEM_IDS_KEY } from './keys';

export function useGoodsReceiptInventoryItemIds(id: string) {
  return useQuery<string[], AxiosError>({
    queryKey: GOODS_RECEIPT_INVENTORY_ITEM_IDS_KEY(id),
    queryFn: () => getGoodsReceiptInventoryItemIds(id),
  });
}
