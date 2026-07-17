import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { type UpdateTaxClassPayload, updateTaxClass } from '@/services/organization/tax-classes.service';
import { TAX_CLASS_KEY, TAX_CLASSES_TABLE_KEY } from './keys';

interface Vars {
  id: string;
  data: UpdateTaxClassPayload;
}

export function useUpdateTaxClass(options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateTaxClass,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: TAX_CLASSES_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: TAX_CLASS_KEY(vars.id) });
      options?.onSuccess?.(...args);
    },
  });
}
