import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { BatchLedgerTableResponse, InventoryItemBatchData } from '@/schemas/inventory-item-batches';
import { getInventoryItemBatch, getInventoryItemBatchLedgerTable } from '@/services/inventory-item-batches.service';
import { INVENTORY_ITEM_BATCH_KEY, INVENTORY_ITEM_BATCH_LEDGER_KEY } from './keys';

export function useInventoryItemBatch(
  id: string | null,
  options?: Omit<UseQueryOptions<InventoryItemBatchData, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryItemBatchData, AxiosError>({
    queryKey: [...INVENTORY_ITEM_BATCH_KEY(id ?? '')],
    queryFn: () => getInventoryItemBatch(id as string),
    enabled: !!id,
    ...options,
  });
}

export function useInventoryItemBatchLedgerTable(
  batchId: string | null,
  options?: Omit<UseQueryOptions<BatchLedgerTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<BatchLedgerTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEM_BATCH_LEDGER_KEY(batchId ?? '')],
    queryFn: () => getInventoryItemBatchLedgerTable(batchId as string),
    enabled: !!batchId,
    ...options,
  });
}
