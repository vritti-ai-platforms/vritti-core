import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreateCatalogResponse } from '@/schemas/catalogs';
import { cloneCatalog } from '@/site/services/catalogs.service';
import { CATALOGS_TABLE_KEY } from './keys';

interface Vars {
  id: string;
}

export function useCloneCatalog(
  options?: Omit<UseMutationOptions<CreateCatalogResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateCatalogResponse, AxiosError, Vars>({
    ...options,
    mutationFn: cloneCatalog,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATALOGS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
