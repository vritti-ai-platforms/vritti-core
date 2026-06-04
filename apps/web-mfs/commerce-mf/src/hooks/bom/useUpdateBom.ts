import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { BomDetail } from '@/schemas/bom';
import { type UpdateBomPayload, updateBom } from '@/services/bom.service';
import { BOM_DETAIL_KEY, BOM_TABLE_KEY } from './keys';

// Updates a BOM and invalidates table + detail
export function useUpdateBom(
  options?: Omit<UseMutationOptions<BomDetail, AxiosError, { id: string; data: UpdateBomPayload }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<BomDetail, AxiosError, { id: string; data: UpdateBomPayload }>({
    ...options,
    mutationFn: updateBom,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: BOM_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: BOM_DETAIL_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
