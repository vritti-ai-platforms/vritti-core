import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CatalogListingData } from '@/schemas/catalogs';
import { type AddCatalogListingPayload, addCatalogListing } from '@/services/organization/catalogs.service';
import { CATALOGS_KEY } from './keys';

export function useAddCatalogListing(
  options?: Omit<
    UseMutationOptions<CreateResponse<CatalogListingData>, AxiosError, AddCatalogListingPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CatalogListingData>, AxiosError, AddCatalogListingPayload>({
    ...options,
    mutationFn: addCatalogListing,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATALOGS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
