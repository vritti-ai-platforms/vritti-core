import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteCatalogChannel } from '@/services/organization/catalog-channels.service';
import { CATALOG_CHANNELS_KEY } from './keys';

export function useDeleteCatalogChannel(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteCatalogChannel,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATALOG_CHANNELS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
