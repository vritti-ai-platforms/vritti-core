import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_SALES_CHANNELS } from '@vritti/commerce-permissions/sales-channels';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import { getSalesChannelsTable } from '@/services/organization/sales-channels.service';
import type { SalesChannelsTableResponse } from '@/schemas/sales-channels';
import { SALES_CHANNELS_TABLE_KEY } from './keys';

export function useSalesChannelsTable(
  options?: Omit<UseQueryOptions<SalesChannelsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_SALES_CHANNELS.view);
  return useQuery<SalesChannelsTableResponse, AxiosError>({
    queryKey: [...SALES_CHANNELS_TABLE_KEY],
    queryFn: getSalesChannelsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
