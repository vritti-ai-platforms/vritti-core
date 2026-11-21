import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateChannelPagesData } from '@/schemas/offerings';
import { createChannelPages } from '@/services/legal-entity/offerings.service';

// Creates pages on one channel's storefront, then re-reads that channel's rows
export function useCreateOfferingChannelPages(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, CreateChannelPagesData>({
    mutationFn: createChannelPages,
    onSuccess: () => {
      invalidateWrites(queryClient, [Tables.externalStorefrontProductStatuses]);
      options?.onSuccess?.();
    },
  });
}
