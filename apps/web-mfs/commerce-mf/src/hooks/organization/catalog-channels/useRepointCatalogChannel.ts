import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { repointCatalogChannel } from '@/services/organization/catalog-channels.service';
import { CATALOG_CHANNELS_KEY } from './keys';

type Variables = { id: string; catalogId: string };

export function useRepointCatalogChannel(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Variables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    ...options,
    mutationFn: repointCatalogChannel,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATALOG_CHANNELS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
