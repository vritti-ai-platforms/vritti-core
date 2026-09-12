import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CatalogChannelData, CreateCatalogChannelFormData } from '@/schemas/catalog-channels';
import { createCatalogChannel } from '@/services/organization/catalog-channels.service';
import { CATALOG_CHANNELS_KEY } from './keys';

export function useCreateCatalogChannel(
  options?: Omit<
    UseMutationOptions<CreateResponse<CatalogChannelData>, AxiosError, CreateCatalogChannelFormData>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CatalogChannelData>, AxiosError, CreateCatalogChannelFormData>({
    ...options,
    mutationFn: createCatalogChannel,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATALOG_CHANNELS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
