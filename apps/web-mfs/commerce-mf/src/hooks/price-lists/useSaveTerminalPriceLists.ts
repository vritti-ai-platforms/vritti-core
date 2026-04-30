import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import type { SaveTerminalPriceListsData } from '@/schemas/price-lists';
import { saveTerminalPriceLists } from '@/services/price-lists.service';
import { POS_TERMINAL_SELLABLE_ITEMS_KEY, TERMINAL_PRICE_LISTS_KEY } from './keys';

interface SaveTerminalPriceListsVariables {
  terminalId: string;
  data: SaveTerminalPriceListsData;
}

export function useSaveTerminalPriceLists(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SaveTerminalPriceListsVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, SaveTerminalPriceListsVariables>({
    ...options,
    mutationFn: saveTerminalPriceLists,
    onSuccess: (...args) => {
      const variables = args[1];
      queryClient.invalidateQueries({ queryKey: TERMINAL_PRICE_LISTS_KEY(variables.terminalId) });
      queryClient.invalidateQueries({ queryKey: POS_TERMINAL_SELLABLE_ITEMS_KEY(variables.terminalId) });
      options?.onSuccess?.(...args);
    },
  });
}
