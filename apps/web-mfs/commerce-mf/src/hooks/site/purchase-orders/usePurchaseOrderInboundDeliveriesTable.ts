import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { SITE_PURCHASE_ORDERS } from '@vritti/commerce-permissions/purchase-orders';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { InboundDeliveriesTableResponse } from '@/schemas/inbound-deliveries';
import { getPurchaseOrderInboundDeliveriesTable } from '@/services/site/purchase-orders.service';
import { PURCHASE_ORDER_INBOUND_DELIVERIES_TABLE_KEY } from './keys';

// Fetches the inbound deliveries carrying a line of a purchase order; self-gates on the view permission
export function usePurchaseOrderInboundDeliveriesTable(
  id: string,
  options?: Omit<UseQueryOptions<InboundDeliveriesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(SITE_PURCHASE_ORDERS.view);
  return useQuery<InboundDeliveriesTableResponse, AxiosError>({
    queryKey: PURCHASE_ORDER_INBOUND_DELIVERIES_TABLE_KEY(id),
    queryFn: () => getPurchaseOrderInboundDeliveriesTable(id),
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
