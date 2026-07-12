import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptLineItemsTableResponse } from '@/schemas/goods-receipts';
import { getGoodsReceiptLineItemsTable } from '@/site/services/goods-receipts.service';
import { GOODS_RECEIPT_LINE_ITEMS_TABLE_KEY } from './keys';

export function useGoodsReceiptLineItemsTable(id: string, itemId: string | null, lineId: string | null) {
  return useQuery<GoodsReceiptLineItemsTableResponse, AxiosError>({
    queryKey: GOODS_RECEIPT_LINE_ITEMS_TABLE_KEY(id, itemId ?? '', lineId ?? ''),
    queryFn: () => getGoodsReceiptLineItemsTable(id, itemId as string, lineId as string),
    enabled: !!itemId && !!lineId,
  });
}
