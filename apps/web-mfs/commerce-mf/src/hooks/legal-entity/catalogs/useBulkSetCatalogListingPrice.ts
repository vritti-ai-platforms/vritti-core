import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { bulkSetCatalogListingPrice } from '@/services/legal-entity/catalogs.service';

type Variables = { catalogId: string; ids: string[]; price: CurrencyValue };

export function useBulkSetCatalogListingPrice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Variables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    ...options,
    mutationFn: bulkSetCatalogListingPrice,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.catalogListingPrices]);
      options?.onSuccess?.(...args);
    },
  });
}
