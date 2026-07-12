import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLotDetailData } from '@/schemas/stock-adjustments';
import { getStockAdjustmentLotDetail } from '@/site/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_LOT_KEY } from './keys';

export function useStockAdjustmentLotDetail(adjustmentId: string, lotId: string | null) {
  return useQuery<StockAdjustmentLotDetailData, AxiosError>({
    queryKey: [...STOCK_ADJUSTMENT_LOT_KEY(adjustmentId, lotId ?? ''), 'detail'],
    queryFn: () => getStockAdjustmentLotDetail(adjustmentId, lotId as string),
    enabled: !!lotId,
  });
}
