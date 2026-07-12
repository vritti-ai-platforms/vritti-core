import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptLinesTableResponse } from '@/schemas/goods-receipts';
import { getGoodsReceiptLinesTable } from '@/site/services/goods-receipts.service';
import { GOODS_RECEIPT_LINES_TABLE_KEY } from './keys';

export function useGoodsReceiptLinesTable(id: string, itemId: string | null) {
  return useQuery<GoodsReceiptLinesTableResponse, AxiosError>({
    queryKey: GOODS_RECEIPT_LINES_TABLE_KEY(id, itemId ?? ''),
    queryFn: () => getGoodsReceiptLinesTable(id, itemId as string),
    enabled: !!itemId,
  });
}
