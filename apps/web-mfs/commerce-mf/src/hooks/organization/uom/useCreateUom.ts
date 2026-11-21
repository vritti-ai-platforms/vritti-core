import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateUomData, CreateUomResponse } from '@/schemas/uom';
import { createUom } from '@/services/organization/uom.service';

// Creates a new UOM and invalidates the UOM table
export function useCreateUom(
  options?: Omit<UseMutationOptions<CreateUomResponse, AxiosError, CreateUomData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateUomResponse, AxiosError, CreateUomData>({
    ...options,
    mutationFn: createUom,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.uom]);
      options?.onSuccess?.(...args);
    },
  });
}
