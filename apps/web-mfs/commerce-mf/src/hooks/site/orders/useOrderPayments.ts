import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OrderPayment } from '@/schemas/orders';
import { getOrderPayments } from '@/services/site/orders.service';
import { ORDER_PAYMENTS_KEY } from './keys';

// How often the list is read again while a refund is still on its way
const REFUND_POLL_MS = 15_000;

// A refund the gateway has not confirmed yet, or an unused payment core is about to refund
function refundUnderWay(payments: OrderPayment[] | undefined): boolean {
  return (
    payments?.some(
      (payment) => payment.status === 'REFUND_PENDING' || (payment.status === 'SUCCEEDED' && !payment.usedForOrder),
    ) ?? false
  );
}

// The payments of an order's checkout. Re-read on its own while a refund is under way, so staff see it settle
// without reloading
export function useOrderPayments(
  id: string | null,
  options?: Omit<UseQueryOptions<OrderPayment[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<OrderPayment[], AxiosError>({
    queryKey: ORDER_PAYMENTS_KEY(id ?? ''),
    queryFn: () => getOrderPayments(id as string),
    enabled: !!id,
    refetchInterval: (query) => (refundUnderWay(query.state.data) ? REFUND_POLL_MS : false),
    ...options,
  });
}
