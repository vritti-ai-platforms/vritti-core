import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateLocationData, CreateLocationResponse } from '@/schemas/locations';
import { createLocation } from '@/services/site/locations.service';

export function useCreateLocation(
  options?: Omit<UseMutationOptions<CreateLocationResponse, AxiosError, CreateLocationData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateLocationResponse, AxiosError, CreateLocationData>({
    ...options,
    mutationFn: createLocation,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.locations]);
      options?.onSuccess?.(...args);
    },
  });
}
