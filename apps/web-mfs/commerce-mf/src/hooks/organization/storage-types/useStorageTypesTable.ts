import { keepPreviousData, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_STORAGE_TYPES } from '@vritti/commerce-permissions/storage-types';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { StorageTypesTableResponse } from '@/schemas/storage-types';
import { getStorageTypesTable } from '@/services/organization/storage-types.service';
import { STORAGE_TYPES_TABLE_KEY } from './keys';

// Fetches the storage types table; self-gates on the view permission
export function useStorageTypesTable(
  options?: Omit<UseQueryOptions<StorageTypesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_STORAGE_TYPES.view);
  return useQuery<StorageTypesTableResponse, AxiosError>({
    queryKey: STORAGE_TYPES_TABLE_KEY,
    queryFn: getStorageTypesTable,
    placeholderData: keepPreviousData,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
