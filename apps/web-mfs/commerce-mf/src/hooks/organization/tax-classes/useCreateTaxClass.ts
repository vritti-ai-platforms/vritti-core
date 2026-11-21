import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { TaxClassData } from '@/schemas/tax-classes';
import { type CreateTaxClassPayload, createTaxClass } from '@/services/organization/tax-classes.service';

export function useCreateTaxClass(
  options?: Omit<UseMutationOptions<TaxClassData, AxiosError, CreateTaxClassPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<TaxClassData, AxiosError, CreateTaxClassPayload>({
    ...options,
    mutationFn: createTaxClass,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxClasses]);
      options?.onSuccess?.(...args);
    },
  });
}
