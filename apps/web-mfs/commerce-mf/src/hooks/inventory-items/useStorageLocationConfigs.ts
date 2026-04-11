import { type UseMutationOptions, type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { StorageLocationConfigData, StorageLocationConfigsTableResponse } from '@/schemas/storage-location-configs';
import {
  createStorageLocationConfig,
  deleteStorageLocationConfig,
  getStorageLocationConfigsTable,
  updateStorageLocationConfig,
} from '@/services/storage-location-configs.service';

export const STORAGE_LOCATION_CONFIGS_KEY = (itemId: string) =>
  ['commerce', 'inventory-items', itemId, 'storage-location-configs'] as const;

export function useStorageLocationConfigsTable(
  itemId: string | null,
  options?: Omit<UseQueryOptions<StorageLocationConfigsTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<StorageLocationConfigsTableResponse, AxiosError>({
    queryKey: [...STORAGE_LOCATION_CONFIGS_KEY(itemId ?? '')],
    queryFn: () => getStorageLocationConfigsTable(itemId as string),
    enabled: !!itemId,
    ...options,
  });
}

export function useCreateStorageLocationConfig(
  itemId: string,
  options?: UseMutationOptions<CreateResponse<StorageLocationConfigData>, AxiosError, { locationId: string; reorderLevel: number }>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<StorageLocationConfigData>, AxiosError, { locationId: string; reorderLevel: number }>({
    mutationFn: (data) => createStorageLocationConfig(itemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STORAGE_LOCATION_CONFIGS_KEY(itemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateStorageLocationConfig(
  itemId: string,
  options?: UseMutationOptions<SuccessResponse, AxiosError, { configId: string; reorderLevel: number }>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { configId: string; reorderLevel: number }>({
    mutationFn: ({ configId, reorderLevel }) => updateStorageLocationConfig(itemId, configId, { reorderLevel }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STORAGE_LOCATION_CONFIGS_KEY(itemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteStorageLocationConfig(
  itemId: string,
  options?: UseMutationOptions<SuccessResponse, AxiosError, string>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: (configId) => deleteStorageLocationConfig(itemId, configId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STORAGE_LOCATION_CONFIGS_KEY(itemId) });
      options?.onSuccess?.(...args);
    },
  });
}
