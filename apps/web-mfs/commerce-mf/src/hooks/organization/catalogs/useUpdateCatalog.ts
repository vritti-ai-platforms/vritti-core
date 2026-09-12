import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { type UpdateCatalogPayload, updateCatalog } from '@/services/organization/catalogs.service';
import { CATALOGS_KEY } from './keys';

export function useUpdateCatalog(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateCatalogPayload }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateCatalogPayload }>({
    ...options,
    mutationFn: updateCatalog,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATALOGS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
