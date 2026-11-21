import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { setCatalogListingChannelVisibility } from '@/services/site/catalogs.service';

type Variables = { catalogId: string; listingId: string; channelId: string; visible: boolean };

export function useSetCatalogListingChannelVisibility(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Variables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    ...options,
    mutationFn: setCatalogListingChannelVisibility,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.catalogListingChannelExclusions]);
      options?.onSuccess?.(...args);
    },
  });
}
