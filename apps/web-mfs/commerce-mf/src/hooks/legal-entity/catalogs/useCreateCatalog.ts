import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CatalogData } from '@/schemas/catalogs';
import { type CreateCatalogPayload, createCatalog } from '@/services/legal-entity/catalogs.service';

export function useCreateCatalog(
  options?: Omit<UseMutationOptions<CreateResponse<CatalogData>, AxiosError, CreateCatalogPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CatalogData>, AxiosError, CreateCatalogPayload>({
    ...options,
    mutationFn: createCatalog,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.catalogs]);
      options?.onSuccess?.(...args);
    },
  });
}
