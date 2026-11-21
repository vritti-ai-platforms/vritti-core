import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { clearCatalogListingPrice } from '@/services/organization/catalogs.service';

type Variables = { catalogId: string; listingId: string; currencyCode: string };

export function useClearCatalogListingPrice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Variables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    ...options,
    mutationFn: clearCatalogListingPrice,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.catalogListingPrices]);
      options?.onSuccess?.(...args);
    },
  });
}
