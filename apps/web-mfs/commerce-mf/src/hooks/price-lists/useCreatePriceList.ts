import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreatePriceListData, CreatePriceListResponse } from '@/schemas/price-lists';
import { createPriceList } from '@/services/price-lists.service';
import { PRICE_LISTS_KEY } from './keys';

export function useCreatePriceList(
  options?: Omit<UseMutationOptions<CreatePriceListResponse, AxiosError, CreatePriceListData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreatePriceListResponse, AxiosError, CreatePriceListData>({
    ...options,
    mutationFn: createPriceList,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PRICE_LISTS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
