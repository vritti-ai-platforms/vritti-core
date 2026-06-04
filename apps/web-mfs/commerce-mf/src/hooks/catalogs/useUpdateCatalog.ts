import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import type { UpdateCatalogData } from '@/schemas/catalogs';
import { updateCatalog } from '@/services/catalogs.service';
import { CATALOG_CHANNELS_KEY, CATALOG_KEY, CATALOGS_TABLE_KEY } from './keys';

interface Vars {
  id: string;
  data: UpdateCatalogData;
}

export function useUpdateCatalog(options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateCatalog,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: CATALOGS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: CATALOG_KEY(vars.id) });
      queryClient.invalidateQueries({ queryKey: CATALOG_CHANNELS_KEY(vars.id) });
      options?.onSuccess?.(...args);
    },
  });
}
