import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptCostsData } from '@/schemas/inventory-item-costs';
import { getGoodsReceiptCosts } from '@/services/goods-receipt-costs.service';
import { GOODS_RECEIPT_COSTS_KEY } from './keys';

export function useGoodsReceiptCosts(
  grId: string,
  options?: Omit<UseQueryOptions<GoodsReceiptCostsData, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<GoodsReceiptCostsData, AxiosError>({
    queryKey: [...GOODS_RECEIPT_COSTS_KEY(grId)],
    queryFn: () => getGoodsReceiptCosts(grId),
    enabled: !!grId,
    ...options,
  });
}
