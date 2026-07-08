import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { UOM } from '@vritti/commerce-permissions/uom';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { UomTableResponse } from '@/schemas/uom';
import { getUomTable } from '@/services/uom.service';
import { UOM_TABLE_KEY } from './keys';

export function useUomTable(
  dimensionId: string | null,
  options?: Omit<UseQueryOptions<UomTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  // The table endpoint is guarded by uom.view — self-gate so a locked/denied user never fires the request
  const { available } = usePermission(UOM.view);
  return useQuery<UomTableResponse, AxiosError>({
    queryKey: [...UOM_TABLE_KEY, dimensionId],
    queryFn: () => getUomTable(dimensionId as string),
    ...options,
    enabled: !!dimensionId && available && (options?.enabled ?? true),
  });
}
