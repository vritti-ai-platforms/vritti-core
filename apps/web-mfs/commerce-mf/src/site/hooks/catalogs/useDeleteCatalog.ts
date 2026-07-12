import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteCatalog } from '@/site/services/catalogs.service';
import { CATALOGS_TABLE_KEY } from './keys';

export function useDeleteCatalog(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteCatalog,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATALOGS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
