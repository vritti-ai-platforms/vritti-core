import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_UOM } from '@vritti/commerce-permissions/uom';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import { getUomTable } from '@/org/services/uom.service';
import type { UomTableResponse } from '@/schemas/uom';
import { UOM_TABLE_KEY } from './keys';

export function useUomTable(
  dimensionId: string | null,
  options?: Omit<UseQueryOptions<UomTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  // The table endpoint is guarded by uom.view — self-gate so a locked/denied user never fires the request
  const { available } = usePermission(ORG_UOM.view);
  return useQuery<UomTableResponse, AxiosError>({
    queryKey: [...UOM_TABLE_KEY, dimensionId],
    queryFn: () => getUomTable(dimensionId as string),
    ...options,
    enabled: !!dimensionId && available && (options?.enabled ?? true),
  });
}
