import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InboundDeliveryCounts } from '@/schemas/inbound-deliveries';
import { getInboundDeliveryCounts } from '@/services/site/inbound-deliveries.service';
import { INBOUND_DELIVERY_COUNTS_KEY } from './keys';

// Fetches how many lines an inbound delivery has, one per tab; under the delivery's key, so whatever refreshes the
// delivery refreshes them
export function useInboundDeliveryCounts(id: string) {
  return useQuery<InboundDeliveryCounts, AxiosError>({
    queryKey: INBOUND_DELIVERY_COUNTS_KEY(id),
    queryFn: () => getInboundDeliveryCounts(id),
  });
}
