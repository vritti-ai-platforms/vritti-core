import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import type { UpdateLocationData } from '@/schemas/locations';
import { updateLocation } from '@/services/locations.service';
import { LOCATIONS_KEY } from './keys';

export function useUpdateLocation(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateLocationData }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateLocationData }>({
    ...options,
    mutationFn: updateLocation,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
