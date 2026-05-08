import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { BomDetail } from '@/schemas/bom';
import { type CreateBomPayload, createBom } from '@/services/bom.service';
import { BOM_TABLE_KEY } from './keys';

// Creates a new BOM and invalidates the table
export function useCreateBom(
  options?: Omit<UseMutationOptions<BomDetail, AxiosError, CreateBomPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<BomDetail, AxiosError, CreateBomPayload>({
    ...options,
    mutationFn: createBom,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: BOM_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
