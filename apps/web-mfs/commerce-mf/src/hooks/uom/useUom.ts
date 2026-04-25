import { type UseQueryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { UomData } from '@/schemas/uom';
import { listBaseUnits, listDerivedUnits } from '@/services/uom.service';
import { UOM_BASE_KEY, UOM_DERIVED_KEY } from './keys';

// Fetches base units, optionally filtered by search — suspends until data is available
export function useBaseUnits(search?: string) {
  return useSuspenseQuery<UomData[], AxiosError>({
    queryKey: [...UOM_BASE_KEY, search],
    queryFn: () => listBaseUnits(search),
  });
}

// Fetches derived units for a given base unit
export function useDerivedUnits(
  baseUnitId: string | null,
  options?: Omit<UseQueryOptions<UomData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<UomData[], AxiosError>({
    queryKey: [...UOM_DERIVED_KEY, baseUnitId],
    queryFn: () => listDerivedUnits(baseUnitId as string),
    enabled: !!baseUnitId,
    ...options,
  });
}
