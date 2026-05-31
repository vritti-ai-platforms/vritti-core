import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptItemsCostData } from '@/schemas/goods-receipts';
import { getGoodsReceiptItemsCost } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_ITEMS_COST_KEY } from './keys';

export function useGoodsReceiptItemsCost(id: string, options?: { enabled?: boolean }) {
  return useQuery<GoodsReceiptItemsCostData, AxiosError>({
    queryKey: GOODS_RECEIPT_ITEMS_COST_KEY(id),
    queryFn: () => getGoodsReceiptItemsCost(id),
    enabled: options?.enabled ?? true,
  });
}
