import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptItemPricePrefill } from '@/schemas/goods-receipts';
import { getGoodsReceiptItemPricePrefill } from '@/services/goods-receipts.service';

const KEY = (id: string, inventoryItemId: string | null, uomId: string | null) =>
  ['commerce', 'goods-receipts', id, 'items', 'price-prefill', inventoryItemId ?? '', uomId ?? ''] as const;

// Resolves the supplier unit price for the Add Item dialog. Order: PO → supplier_items → null.
// Disabled until both inventoryItemId + uomId are known (typically after a supplier item is
// selected in the form).
export function useGoodsReceiptItemPricePrefill(
  goodsReceiptId: string,
  inventoryItemId: string | null,
  uomId: string | null,
  options?: Omit<UseQueryOptions<GoodsReceiptItemPricePrefill, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<GoodsReceiptItemPricePrefill, AxiosError>({
    queryKey: [...KEY(goodsReceiptId, inventoryItemId, uomId)],
    queryFn: () => getGoodsReceiptItemPricePrefill(goodsReceiptId, inventoryItemId!, uomId!),
    enabled: !!goodsReceiptId && !!inventoryItemId && !!uomId,
    staleTime: 30_000,
    ...options,
  });
}
