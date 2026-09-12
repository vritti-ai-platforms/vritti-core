import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { SetCatalogListingPriceFormData } from '@/schemas/catalogs';
import { setCatalogListingPrice } from '@/services/organization/catalogs.service';
import { CATALOGS_KEY } from './keys';

type Variables = SetCatalogListingPriceFormData & { catalogId: string; listingId: string };

export function useSetCatalogListingPrice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Variables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    ...options,
    mutationFn: setCatalogListingPrice,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATALOGS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
