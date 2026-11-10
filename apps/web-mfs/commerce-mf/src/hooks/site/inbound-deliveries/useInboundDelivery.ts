import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InboundDeliveryData } from '@/schemas/inbound-deliveries';
import { getInboundDelivery } from '@/services/site/inbound-deliveries.service';
import { INBOUND_DELIVERY_KEY } from './keys';

// Fetches one inbound delivery
export function useInboundDelivery(id: string) {
  return useSuspenseQuery<InboundDeliveryData, AxiosError>({
    queryKey: INBOUND_DELIVERY_KEY(id),
    queryFn: () => getInboundDelivery(id),
  });
}
