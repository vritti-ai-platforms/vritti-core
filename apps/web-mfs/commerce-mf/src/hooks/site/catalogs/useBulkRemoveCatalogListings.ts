import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { bulkRemoveCatalogListings } from '@/services/site/catalogs.service';
import { CATALOGS_KEY } from './keys';

type Variables = { catalogId: string; ids: string[] };

export function useBulkRemoveCatalogListings(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Variables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    ...options,
    mutationFn: bulkRemoveCatalogListings,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATALOGS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
