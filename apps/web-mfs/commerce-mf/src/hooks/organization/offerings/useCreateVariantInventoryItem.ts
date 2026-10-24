import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateVariantInventoryItemData, OfferingVariantData } from '@/schemas/offerings';
import { createInventoryItem } from '@/services/organization/offerings.service';
import { useInvalidate } from './useInvalidate';

// Creates the variant's inventory item and links it in one call — the response is the updated variant
export function useCreateVariantInventoryItem(
  options?: Omit<
    UseMutationOptions<CreateResponse<OfferingVariantData>, AxiosError, CreateVariantInventoryItemData>,
    'mutationFn'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<CreateResponse<OfferingVariantData>, AxiosError, CreateVariantInventoryItemData>({
    ...options,
    mutationFn: createInventoryItem,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
