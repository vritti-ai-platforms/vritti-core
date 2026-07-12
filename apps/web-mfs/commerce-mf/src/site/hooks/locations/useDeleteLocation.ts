import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteLocation } from '@/site/services/locations.service';
import { LOCATIONS_KEY } from './keys';

export function useDeleteLocation(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteLocation,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
