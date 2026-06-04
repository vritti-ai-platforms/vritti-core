import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { deleteOffering } from '@/services/offerings.service';
import { OFFERINGS_TABLE_KEY } from './keys';

interface DeleteOfferingVariables {
  catalogId: string;
  offeringId: string;
}

// Deletes an offering and invalidates the offerings table
export function useDeleteOffering(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, DeleteOfferingVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, DeleteOfferingVariables>({
    ...options,
    mutationFn: deleteOffering,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: OFFERINGS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
