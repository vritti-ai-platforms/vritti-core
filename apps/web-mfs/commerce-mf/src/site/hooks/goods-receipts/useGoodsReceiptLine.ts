import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptLineData } from '@/schemas/goods-receipts';
import { getGoodsReceiptLineById } from '@/site/services/goods-receipts.service';
import { GOODS_RECEIPT_LINE_KEY } from './keys';

export function useGoodsReceiptLine(id: string, itemId: string | null, lineId: string | null) {
  return useQuery<GoodsReceiptLineData, AxiosError>({
    queryKey: GOODS_RECEIPT_LINE_KEY(id, itemId ?? '', lineId ?? ''),
    queryFn: () => getGoodsReceiptLineById(id, itemId as string, lineId as string),
    enabled: !!itemId && !!lineId,
  });
}
