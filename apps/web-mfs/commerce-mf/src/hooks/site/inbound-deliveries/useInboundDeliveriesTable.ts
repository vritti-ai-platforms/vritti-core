import { keepPreviousData, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { SITE_INBOUND_DELIVERIES } from '@vritti/commerce-permissions/inbound-deliveries';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { InboundDeliveriesTableResponse } from '@/schemas/inbound-deliveries';
import { getInboundDeliveriesTable } from '@/services/site/inbound-deliveries.service';
import { INBOUND_DELIVERIES_TABLE_KEY } from './keys';

// Fetches the site's inbound deliveries; self-gates on the view permission
export function useInboundDeliveriesTable(
  options?: Omit<UseQueryOptions<InboundDeliveriesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(SITE_INBOUND_DELIVERIES.view);
  return useQuery<InboundDeliveriesTableResponse, AxiosError>({
    queryKey: INBOUND_DELIVERIES_TABLE_KEY,
    queryFn: getInboundDeliveriesTable,
    placeholderData: keepPreviousData,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
