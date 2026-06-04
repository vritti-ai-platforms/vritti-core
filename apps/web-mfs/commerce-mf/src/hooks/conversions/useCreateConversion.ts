import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ConversionData } from '@/schemas/conversions';
import { type CreateConversionPayload, createConversion } from '@/services/conversions.service';
import { CONVERSIONS_TABLE_KEY } from './keys';

export function useCreateConversion(
  options?: Omit<UseMutationOptions<ConversionData, AxiosError, CreateConversionPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<ConversionData, AxiosError, CreateConversionPayload>({
    ...options,
    mutationFn: createConversion,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CONVERSIONS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
