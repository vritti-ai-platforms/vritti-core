import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { SetVariantAttributesData } from '@/schemas/offerings';
import { setVariantAttributes } from '@/services/legal-entity/offerings.service';
import { useInvalidate } from './useInvalidate';

// The whole set in one call: attributes are multi-valued, so a per-value toggle would make an eight-tag variant eight
// requests and leave it half-tagged if one failed
export function useSetVariantAttributes(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetVariantAttributesData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, SetVariantAttributesData>({
    ...options,
    mutationFn: setVariantAttributes,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
