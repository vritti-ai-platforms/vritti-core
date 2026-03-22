import { type UseMutationOptions, type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { KotItem } from '../schemas';
import { getActiveKotItems, updateKotItemStatus } from '../services';

type UseKotItemsOptions = Omit<UseQueryOptions<KotItem[], Error>, 'queryKey' | 'queryFn'>;

// Fetches active KOT items with polling
export function useKotItems(businessUnitId: string, options?: UseKotItemsOptions) {
  return useQuery<KotItem[], Error>({
    queryKey: ['commerce', 'kot', businessUnitId],
    queryFn: () => getActiveKotItems(businessUnitId),
    enabled: !!businessUnitId,
    refetchInterval: 10_000,
    ...options,
  });
}

interface UpdateKotStatusParams {
  itemId: string;
  status: string;
}

type UseUpdateKotStatusOptions = Omit<UseMutationOptions<unknown, Error, UpdateKotStatusParams>, 'mutationFn'>;

// Updates a KOT item's status and invalidates the list
export function useUpdateKotItemStatus(options?: UseUpdateKotStatusOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, status }: UpdateKotStatusParams) => updateKotItemStatus(itemId, status),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'kot'] });
      queryClient.invalidateQueries({ queryKey: ['commerce', 'orders'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
