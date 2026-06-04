import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptItemsTableResponse } from '@/schemas/goods-receipts';
import { getGoodsReceiptItemsTable } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_ITEMS_TABLE_KEY } from './keys';

export function useGoodsReceiptItemsTable(id: string) {
  return useQuery<GoodsReceiptItemsTableResponse, AxiosError>({
    queryKey: GOODS_RECEIPT_ITEMS_TABLE_KEY(id),
    queryFn: () => getGoodsReceiptItemsTable(id),
  });
}
