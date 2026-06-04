import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OfferingData } from '@/schemas/offerings';
import { type CreateOfferingPayload, createOffering } from '@/services/offerings.service';
import { OFFERINGS_TABLE_KEY } from './keys';

interface CreateOfferingVariables {
  catalogId: string;
  data: CreateOfferingPayload;
}

// Creates a new offering and invalidates the offerings table
export function useCreateOffering(
  options?: Omit<UseMutationOptions<OfferingData, AxiosError, CreateOfferingVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<OfferingData, AxiosError, CreateOfferingVariables>({
    ...options,
    mutationFn: createOffering,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: OFFERINGS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
