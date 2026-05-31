import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptItemQuantsData } from '@/schemas/goods-receipts';
import { getGoodsReceiptItemQuants } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_ITEM_QUANTS_KEY } from './keys';

export function useGoodsReceiptItemQuants(id: string, itemId: string, options?: { enabled?: boolean }) {
  return useQuery<GoodsReceiptItemQuantsData, AxiosError>({
    queryKey: GOODS_RECEIPT_ITEM_QUANTS_KEY(id, itemId),
    queryFn: () => getGoodsReceiptItemQuants(id, itemId),
    enabled: options?.enabled ?? true,
  });
}
