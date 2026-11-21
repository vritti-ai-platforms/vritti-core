import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteCatalogListing } from '@/services/site/catalogs.service';

type Variables = { catalogId: string; listingId: string };

export function useDeleteCatalogListing(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Variables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    ...options,
    mutationFn: deleteCatalogListing,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.catalogListings,
        Tables.catalogListingPrices,
        Tables.catalogListingChannelExclusions,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
