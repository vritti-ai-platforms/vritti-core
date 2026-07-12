import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptLinesTableResponse } from '@/schemas/goods-receipts';
import { getGoodsReceiptLinesByLotTable } from '@/services/site/goods-receipts.service';
import { GOODS_RECEIPT_LINES_BY_LOT_TABLE_KEY } from './keys';

export function useGoodsReceiptLinesByLotTable(id: string, itemId: string | null, lotId: string | null) {
  return useQuery<GoodsReceiptLinesTableResponse, AxiosError>({
    queryKey: GOODS_RECEIPT_LINES_BY_LOT_TABLE_KEY(id, itemId ?? '', lotId ?? ''),
    queryFn: () => getGoodsReceiptLinesByLotTable(id, itemId as string, lotId as string),
    enabled: !!itemId && !!lotId,
  });
}
