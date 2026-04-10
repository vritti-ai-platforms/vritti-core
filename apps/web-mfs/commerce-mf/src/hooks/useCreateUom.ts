import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { UomData } from '@/schemas/uom';
import { type CreateUomPayload, createUom } from '@/services/uom.service';
import { UOM_TABLE_KEY } from './useUom';

// Creates a new UOM and invalidates the UOM list
export function useCreateUom(
  options?: Omit<UseMutationOptions<UomData, AxiosError, CreateUomPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<UomData, AxiosError, CreateUomPayload>({
    ...options,
    mutationFn: createUom,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: UOM_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
