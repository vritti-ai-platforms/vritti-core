import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreateCatalogData, CreateCatalogResponse } from '@/schemas/catalogs';
import { createCatalog } from '@/services/site/catalogs.service';
import { CATALOGS_TABLE_KEY } from './keys';

export function useCreateCatalog(
  options?: Omit<UseMutationOptions<CreateCatalogResponse, AxiosError, CreateCatalogData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateCatalogResponse, AxiosError, CreateCatalogData>({
    ...options,
    mutationFn: createCatalog,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATALOGS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
