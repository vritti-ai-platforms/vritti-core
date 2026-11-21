import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteVariant } from '@/services/organization/offerings.service';

export function useDeleteOfferingVariant(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteVariant,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.offeringVariantValues,
        Tables.offeringVariants,
        Tables.offeringVariantAttributeValues,
        Tables.offeringBom,
        Tables.catalogListings,
        Tables.catalogListingPrices,
        Tables.catalogListingChannelExclusions,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
