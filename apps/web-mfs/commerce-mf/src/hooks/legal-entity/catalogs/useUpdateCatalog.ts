import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { type UpdateCatalogPayload, updateCatalog } from '@/services/legal-entity/catalogs.service';

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
      invalidateWrites(queryClient, [Tables.catalogs]);
      options?.onSuccess?.(...args);
    },
  });
}
