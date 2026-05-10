import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemQuantData, QuantLedgerTableResponse } from '@/schemas/inventory-item-quants';
import { getInventoryItemQuant, getInventoryItemQuantLedgerTable } from '@/services/inventory-item-quants.service';
import { INVENTORY_ITEM_QUANT_KEY, INVENTORY_ITEM_QUANT_LEDGER_KEY } from './keys';

export function useInventoryItemQuant(
  id: string | null,
  options?: Omit<UseQueryOptions<InventoryItemQuantData, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryItemQuantData, AxiosError>({
    queryKey: [...INVENTORY_ITEM_QUANT_KEY(id ?? '')],
    queryFn: () => getInventoryItemQuant(id as string),
    enabled: !!id,
    ...options,
  });
}

export function useInventoryItemQuantLedgerTable(
  quantId: string | null,
  options?: Omit<UseQueryOptions<QuantLedgerTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<QuantLedgerTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEM_QUANT_LEDGER_KEY(quantId ?? '')],
    queryFn: () => getInventoryItemQuantLedgerTable(quantId as string),
    enabled: !!quantId,
    ...options,
  });
}
