import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { TaxComponentData } from '@/schemas/tax-components';
import { type CreateTaxComponentPayload, createTaxComponent } from '@/services/organization/tax-components.service';
import { TAX_COMPONENTS_TABLE_KEY } from './keys';

export function useCreateTaxComponent(
  options?: Omit<UseMutationOptions<TaxComponentData, AxiosError, CreateTaxComponentPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<TaxComponentData, AxiosError, CreateTaxComponentPayload>({
    ...options,
    mutationFn: createTaxComponent,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TAX_COMPONENTS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
