import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import { getGoodsReceipt } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_KEY } from './keys';

export function useGoodsReceipt(id: string) {
  return useSuspenseQuery<GoodsReceiptData, AxiosError>({
    queryKey: GOODS_RECEIPT_KEY(id),
    queryFn: () => getGoodsReceipt(id),
  });
}
