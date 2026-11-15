import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptItemQuantsData } from '@/schemas/goods-receipts';
import { getGoodsReceiptItemQuants } from '@/services/legal-entity/goods-receipts.service';
import { GOODS_RECEIPT_ITEM_QUANTS_KEY } from './keys';

// Fetches the stock batches a posted goods receipt item created
export function useGoodsReceiptItemQuants(id: string, itemId: string) {
  return useQuery<GoodsReceiptItemQuantsData, AxiosError>({
    queryKey: GOODS_RECEIPT_ITEM_QUANTS_KEY(id, itemId),
    queryFn: () => getGoodsReceiptItemQuants(id, itemId),
  });
}
