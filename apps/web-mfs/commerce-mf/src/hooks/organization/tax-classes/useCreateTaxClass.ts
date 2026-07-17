import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { TaxClassData } from '@/schemas/tax-classes';
import { type CreateTaxClassPayload, createTaxClass } from '@/services/organization/tax-classes.service';
import { TAX_CLASSES_TABLE_KEY } from './keys';

export function useCreateTaxClass(
  options?: Omit<UseMutationOptions<TaxClassData, AxiosError, CreateTaxClassPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<TaxClassData, AxiosError, CreateTaxClassPayload>({
    ...options,
    mutationFn: createTaxClass,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TAX_CLASSES_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
