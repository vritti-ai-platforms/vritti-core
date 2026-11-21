import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { bulkClearCatalogListingPrices } from '@/services/site/catalogs.service';

type Variables = { catalogId: string; ids: string[]; currencyCodes: string[] };

export function useBulkClearCatalogListingPrices(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Variables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    ...options,
    mutationFn: bulkClearCatalogListingPrices,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.catalogListingPrices]);
      options?.onSuccess?.(...args);
    },
  });
}
