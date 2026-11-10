import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { LE_INBOUND_DELIVERIES } from '@vritti/commerce-permissions/inbound-deliveries';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { InboundDeliveryLinesTableResponse } from '@/schemas/inbound-deliveries';
import { getInboundDeliveryLinesTable } from '@/services/legal-entity/inbound-deliveries.service';
import { INBOUND_DELIVERY_ID_INDEX, INBOUND_DELIVERY_LINES_TABLE_KEY } from './keys';

// Fetches an inbound delivery's lines, keeping the previous rows only for the same delivery; self-gates on the view permission
export function useInboundDeliveryLinesTable(
  id: string,
  options?: Omit<UseQueryOptions<InboundDeliveryLinesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(LE_INBOUND_DELIVERIES.view);
  return useQuery<InboundDeliveryLinesTableResponse, AxiosError>({
    queryKey: INBOUND_DELIVERY_LINES_TABLE_KEY(id),
    queryFn: () => getInboundDeliveryLinesTable(id),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[INBOUND_DELIVERY_ID_INDEX] === id ? previous : undefined,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
