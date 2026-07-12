import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptItemData } from '@/schemas/goods-receipts';
import { getGoodsReceiptItem } from '@/services/site/goods-receipts.service';
import { GOODS_RECEIPT_ITEM_DETAIL_KEY } from './keys';

export function useGoodsReceiptItem(id: string, itemId: string | null) {
  return useQuery<GoodsReceiptItemData, AxiosError>({
    queryKey: GOODS_RECEIPT_ITEM_DETAIL_KEY(id, itemId ?? ''),
    queryFn: () => getGoodsReceiptItem(id, itemId as string),
    enabled: !!itemId,
  });
}
