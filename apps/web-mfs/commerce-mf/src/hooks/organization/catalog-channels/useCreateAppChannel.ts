import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { AddAppChannelFormData, CatalogChannelData } from '@/schemas/catalog-channels';
import { createAppChannel } from '@/services/organization/app-catalog-channels.service';
import { APP_CHANNEL_KEY } from './keys';

export function useCreateAppChannel(
  options?: Omit<
    UseMutationOptions<CreateResponse<CatalogChannelData>, AxiosError, AddAppChannelFormData>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CatalogChannelData>, AxiosError, AddAppChannelFormData>({
    ...options,
    mutationFn: createAppChannel,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: APP_CHANNEL_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
