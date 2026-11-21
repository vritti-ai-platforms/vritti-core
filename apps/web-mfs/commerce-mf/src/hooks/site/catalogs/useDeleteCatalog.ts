import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteCatalog } from '@/services/site/catalogs.service';

export function useDeleteCatalog(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteCatalog,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.catalogs,
        Tables.catalogCurrencies,
        Tables.catalogChannels,
        Tables.catalogListings,
        Tables.catalogListingPrices,
        Tables.catalogListingChannelExclusions,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
