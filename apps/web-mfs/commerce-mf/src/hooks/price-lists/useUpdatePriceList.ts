import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import type { UpdatePriceListData } from '@/schemas/price-lists';
import { updatePriceList } from '@/services/price-lists.service';
import { PRICE_LIST_KEY, PRICE_LISTS_KEY } from './keys';

export function useUpdatePriceList(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdatePriceListData }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdatePriceListData }>({
    ...options,
    mutationFn: updatePriceList,
    onSuccess: (...args) => {
      const variables = args[1];
      queryClient.invalidateQueries({ queryKey: PRICE_LISTS_KEY });
      queryClient.invalidateQueries({ queryKey: [...PRICE_LIST_KEY, variables.id] });
      options?.onSuccess?.(...args);
    },
  });
}
