import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreateUomData, CreateUomResponse } from '@/schemas/uom';
import { createUom } from '@/services/uom.service';
import { UOM_BASE_KEY, UOM_DERIVED_KEY } from './keys';

// Creates a new UOM and invalidates the UOM lists
export function useCreateUom(
  options?: Omit<UseMutationOptions<CreateUomResponse, AxiosError, CreateUomData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateUomResponse, AxiosError, CreateUomData>({
    ...options,
    mutationFn: createUom,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: UOM_BASE_KEY });
      queryClient.invalidateQueries({ queryKey: UOM_DERIVED_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
