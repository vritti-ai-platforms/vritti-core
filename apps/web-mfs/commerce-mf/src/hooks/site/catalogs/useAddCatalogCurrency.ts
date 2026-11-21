import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { addCatalogCurrency } from '@/services/site/catalogs.service';

type Variables = { catalogId: string; currencyCode: string };

export function useAddCatalogCurrency(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Variables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    ...options,
    mutationFn: addCatalogCurrency,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.catalogCurrencies]);
      options?.onSuccess?.(...args);
    },
  });
}
