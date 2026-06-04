import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptLotData } from '@/schemas/goods-receipts';
import { getGoodsReceiptLots } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_LOTS_KEY } from './keys';

export function useGoodsReceiptLots(id: string, itemId: string | null) {
  return useQuery<GoodsReceiptLotData[], AxiosError>({
    queryKey: GOODS_RECEIPT_LOTS_KEY(id, itemId ?? ''),
    queryFn: () => getGoodsReceiptLots(id, itemId as string),
    enabled: !!itemId,
  });
}
