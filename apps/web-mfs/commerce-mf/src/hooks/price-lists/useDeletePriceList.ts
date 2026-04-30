import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { deletePriceList } from '@/services/price-lists.service';
import { PRICE_LISTS_KEY } from './keys';

export function useDeletePriceList(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deletePriceList,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PRICE_LISTS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
