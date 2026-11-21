import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { bulkSetCatalogListingAvailability } from '@/services/site/catalogs.service';

type Variables = { catalogId: string; ids: string[]; channelIds: string[]; visible: boolean };

export function useBulkSetCatalogListingAvailability(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Variables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    ...options,
    mutationFn: bulkSetCatalogListingAvailability,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.catalogListingChannelExclusions]);
      options?.onSuccess?.(...args);
    },
  });
}
