import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateInboundDeliveryPayload, InboundDeliveryData } from '@/schemas/inbound-deliveries';
import { createInboundDelivery } from '@/services/site/inbound-deliveries.service';
import { INBOUND_DELIVERIES_TABLE_KEY } from './keys';

// Announces a delivery from a supplier at the site
export function useCreateInboundDelivery(
  options?: Omit<
    UseMutationOptions<CreateResponse<InboundDeliveryData>, AxiosError, CreateInboundDeliveryPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<InboundDeliveryData>, AxiosError, CreateInboundDeliveryPayload>({
    ...options,
    mutationFn: createInboundDelivery,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERIES_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
