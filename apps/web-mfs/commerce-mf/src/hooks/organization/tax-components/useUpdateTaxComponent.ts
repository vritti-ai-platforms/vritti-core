import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateTaxComponentPayload } from '@/schemas/tax-components';
import { updateTaxComponent } from '@/services/organization/tax-components.service';

interface Vars {
  id: string;
  data: UpdateTaxComponentPayload;
}

export function useUpdateTaxComponent(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateTaxComponent,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxComponents]);
      options?.onSuccess?.(...args);
    },
  });
}
