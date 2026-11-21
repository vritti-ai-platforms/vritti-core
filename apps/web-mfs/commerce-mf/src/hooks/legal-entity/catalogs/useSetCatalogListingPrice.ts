import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SetCatalogListingPriceFormData } from '@/schemas/catalogs';
import { setCatalogListingPrice } from '@/services/legal-entity/catalogs.service';

type Variables = SetCatalogListingPriceFormData & { catalogId: string; listingId: string };

export function useSetCatalogListingPrice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Variables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    ...options,
    mutationFn: setCatalogListingPrice,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.catalogListingPrices]);
      options?.onSuccess?.(...args);
    },
  });
}
