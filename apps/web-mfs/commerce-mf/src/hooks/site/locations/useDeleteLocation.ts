import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteLocation } from '@/services/site/locations.service';

export function useDeleteLocation(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteLocation,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.locations, Tables.inventoryItemLocations, Tables.supplierEnrollments]);
      options?.onSuccess?.(...args);
    },
  });
}
