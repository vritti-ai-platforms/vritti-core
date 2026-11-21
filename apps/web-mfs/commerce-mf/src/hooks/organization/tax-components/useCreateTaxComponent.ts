import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateTaxComponentPayload, TaxComponentData } from '@/schemas/tax-components';
import { createTaxComponent } from '@/services/organization/tax-components.service';

export function useCreateTaxComponent(
  options?: Omit<UseMutationOptions<TaxComponentData, AxiosError, CreateTaxComponentPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<TaxComponentData, AxiosError, CreateTaxComponentPayload>({
    ...options,
    mutationFn: createTaxComponent,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxComponents]);
      options?.onSuccess?.(...args);
    },
  });
}
