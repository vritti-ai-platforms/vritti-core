import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { UomData, UomTableResponse } from '@/schemas/uom';
import { getUomTable, listUom } from '@/services/uom.service';

export const UOM_TABLE_KEY = ['commerce', 'uom', 'table'] as const;
export const UOM_LIST_KEY = ['commerce', 'uom', 'list'] as const;

// Fetches UOM table data with server state
export function useUomTable(
  options?: Omit<UseQueryOptions<UomTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<UomTableResponse, AxiosError>({
    queryKey: [...UOM_TABLE_KEY],
    queryFn: getUomTable,
    ...options,
  });
}

// Fetches all UOMs as a simple list (for form dropdowns)
export function useUom(
  options?: Omit<UseQueryOptions<UomData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<UomData[], AxiosError>({
    queryKey: [...UOM_LIST_KEY],
    queryFn: listUom,
    ...options,
  });
}
