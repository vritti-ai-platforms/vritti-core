import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CatalogData } from '@/schemas/catalogs';
import { type CreateCatalogPayload, createCatalog } from '@/services/organization/catalogs.service';
import { CATALOGS_KEY } from './keys';

export function useCreateCatalog(
  options?: Omit<UseMutationOptions<CreateResponse<CatalogData>, AxiosError, CreateCatalogPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CatalogData>, AxiosError, CreateCatalogPayload>({
    ...options,
    mutationFn: createCatalog,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATALOGS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
