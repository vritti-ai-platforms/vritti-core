import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CatalogListingData } from '@/schemas/catalogs';
import { type AddCatalogListingsPayload, addCatalogListings } from '@/services/site/catalogs.service';

export function useAddCatalogListings(
  options?: Omit<
    UseMutationOptions<CreateResponse<CatalogListingData[]>, AxiosError, AddCatalogListingsPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CatalogListingData[]>, AxiosError, AddCatalogListingsPayload>({
    ...options,
    mutationFn: addCatalogListings,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.catalogListings, Tables.catalogListingPrices]);
      options?.onSuccess?.(...args);
    },
  });
}
