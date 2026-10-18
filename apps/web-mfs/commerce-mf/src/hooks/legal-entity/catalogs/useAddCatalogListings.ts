import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CatalogListingData } from '@/schemas/catalogs';
import { type AddCatalogListingsPayload, addCatalogListings } from '@/services/legal-entity/catalogs.service';
import { CATALOGS_KEY } from './keys';

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
      queryClient.invalidateQueries({ queryKey: CATALOGS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
