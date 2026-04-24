import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import { getGoodsReceipt } from '@/services/goods-receipts.service';

export const GOODS_RECEIPT_KEY = (id: string) => ['commerce', 'goods-receipts', id] as const;

export function useGoodsReceipt(id: string) {
  return useSuspenseQuery<GoodsReceiptData, AxiosError>({
    queryKey: GOODS_RECEIPT_KEY(id),
    queryFn: () => getGoodsReceipt(id),
  });
}
