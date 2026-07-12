import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { createUom } from '@/services/organization/uom.service';
import type { CreateUomData, CreateUomResponse } from '@/schemas/uom';
import { UOM_DIMENSIONS_KEY } from '../uom-dimensions/keys';
import { UOM_TABLE_KEY } from './keys';

// Creates a new UOM and invalidates the UOM table
export function useCreateUom(
  options?: Omit<UseMutationOptions<CreateUomResponse, AxiosError, CreateUomData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateUomResponse, AxiosError, CreateUomData>({
    ...options,
    mutationFn: createUom,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: UOM_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: UOM_DIMENSIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
