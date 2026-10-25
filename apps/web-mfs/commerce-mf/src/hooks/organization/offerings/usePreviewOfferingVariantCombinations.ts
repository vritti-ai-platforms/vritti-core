import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PreviewCombinationsData, VariantCombinationsData } from '@/schemas/offerings';
import { previewVariantCombinations } from '@/services/organization/offerings.service';

export function usePreviewOfferingVariantCombinations(
  options?: Omit<UseMutationOptions<VariantCombinationsData, AxiosError, PreviewCombinationsData>, 'mutationFn'>,
) {
  return useMutation<VariantCombinationsData, AxiosError, PreviewCombinationsData>({
    ...options,
    mutationFn: previewVariantCombinations,
  });
}
