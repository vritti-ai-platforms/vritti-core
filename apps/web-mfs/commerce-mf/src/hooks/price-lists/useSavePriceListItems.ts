import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import type { SavePriceListItemsData } from '@/schemas/price-lists';
import { savePriceListItems } from '@/services/price-lists.service';
import { PRICE_LIST_ITEMS_KEY, PRICE_LIST_KEY } from './keys';

export function useSavePriceListItems(
  priceListId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SavePriceListItemsData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, SavePriceListItemsData>({
    ...options,
    mutationFn: (data) => savePriceListItems({ priceListId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [...PRICE_LIST_KEY, priceListId] });
      queryClient.invalidateQueries({ queryKey: PRICE_LIST_ITEMS_KEY(priceListId) });
      options?.onSuccess?.(...args);
    },
  });
}
