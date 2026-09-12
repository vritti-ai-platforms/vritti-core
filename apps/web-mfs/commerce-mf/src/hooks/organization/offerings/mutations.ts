import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  AddBomLineData,
  CreateDimensionData,
  CreateDimensionFromTemplateData,
  CreateOfferingData,
  CreateVariantData,
  CreateVariantInventoryItemData,
  DeleteBomLineData,
  GenerateVariantsData,
  OfferingData,
  OfferingDimensionData,
  OfferingVariantData,
  PreviewCombinationsData,
  ReorderDimensionsData,
  SetOfferingTaxClassData,
  SetVariantTaxClassData,
  UpdateBomLineData,
  UpdateDimensionData,
  UpdateOfferingFormData,
  UpsertDimensionValuesData,
  VariantCombinationsData,
} from '@/schemas/offerings';
import {
  addBomLine,
  addSuggestedComponent,
  bulkSetOfferingsStatus,
  bulkSetVariantsStatus,
  clearVariantTaxClass,
  createDimension,
  createDimensionFromTemplate,
  createInventoryItem,
  createOffering,
  createVariant,
  deleteBomLine,
  deleteDimension,
  deleteOffering,
  deleteVariant,
  generateVariants,
  previewVariantCombinations,
  reorderDimensions,
  setOfferingStatus,
  setOfferingTaxClass,
  setVariantTaxClass,
  updateBomLine,
  updateDimension,
  updateOffering,
  updateVariant,
  upsertDimensionValues,
} from '@/services/organization/offerings.service';
import { OFFERINGS_KEY } from './keys';

// Every mutation invalidates the whole offerings tree — counts, dimensions and variants all move together
function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: OFFERINGS_KEY });
}

export function useCreateOffering(
  options?: Omit<UseMutationOptions<CreateResponse<OfferingData>, AxiosError, CreateOfferingData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<CreateResponse<OfferingData>, AxiosError, CreateOfferingData>({
    ...options,
    mutationFn: createOffering,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateOffering(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateOfferingFormData }>,
    'mutationFn'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateOfferingFormData }>({
    ...options,
    mutationFn: updateOffering,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useSetOfferingStatus(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; isActive: boolean }>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, { id: string; isActive: boolean }>({
    ...options,
    mutationFn: setOfferingStatus,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useBulkSetOfferingsStatus(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { ids: string[]; isActive: boolean }>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, { ids: string[]; isActive: boolean }>({
    ...options,
    mutationFn: bulkSetOfferingsStatus,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useBulkSetVariantsStatus(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { offeringId: string; ids: string[]; isActive: boolean }>,
    'mutationFn'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, { offeringId: string; ids: string[]; isActive: boolean }>({
    ...options,
    mutationFn: bulkSetVariantsStatus,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteOffering(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteOffering,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useCreateDimension(
  options?: Omit<
    UseMutationOptions<CreateResponse<OfferingDimensionData>, AxiosError, CreateDimensionData>,
    'mutationFn'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<CreateResponse<OfferingDimensionData>, AxiosError, CreateDimensionData>({
    ...options,
    mutationFn: createDimension,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useCreateDimensionFromTemplate(
  options?: Omit<
    UseMutationOptions<CreateResponse<OfferingDimensionData>, AxiosError, CreateDimensionFromTemplateData>,
    'mutationFn'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<CreateResponse<OfferingDimensionData>, AxiosError, CreateDimensionFromTemplateData>({
    ...options,
    mutationFn: createDimensionFromTemplate,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpsertDimensionValues(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpsertDimensionValuesData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, UpsertDimensionValuesData>({
    ...options,
    mutationFn: upsertDimensionValues,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
export function useReorderDimensions(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ReorderDimensionsData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, ReorderDimensionsData>({
    ...options,
    mutationFn: reorderDimensions,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateDimension(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateDimensionData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, UpdateDimensionData>({
    ...options,
    mutationFn: updateDimension,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteDimension(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteDimension,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useCreateVariant(
  options?: Omit<UseMutationOptions<CreateResponse<OfferingVariantData>, AxiosError, CreateVariantData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<CreateResponse<OfferingVariantData>, AxiosError, CreateVariantData>({
    ...options,
    mutationFn: createVariant,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function usePreviewVariantCombinations(
  options?: Omit<UseMutationOptions<VariantCombinationsData, AxiosError, PreviewCombinationsData>, 'mutationFn'>,
) {
  return useMutation<VariantCombinationsData, AxiosError, PreviewCombinationsData>({
    ...options,
    mutationFn: previewVariantCombinations,
  });
}

export function useGenerateVariants(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, GenerateVariantsData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, GenerateVariantsData>({
    ...options,
    mutationFn: generateVariants,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateVariant(
  options?: Omit<
    UseMutationOptions<
      SuccessResponse,
      AxiosError,
      { id: string; data: { name?: string; externalSku?: string | null; isActive?: boolean } }
    >,
    'mutationFn'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<
    SuccessResponse,
    AxiosError,
    { id: string; data: { name?: string; externalSku?: string | null; isActive?: boolean } }
  >({
    ...options,
    mutationFn: updateVariant,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

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

export function useAddBomLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, AddBomLineData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, AddBomLineData>({
    ...options,
    mutationFn: addBomLine,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateBomLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateBomLineData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, UpdateBomLineData>({
    ...options,
    mutationFn: updateBomLine,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteBomLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, DeleteBomLineData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, DeleteBomLineData>({
    ...options,
    mutationFn: deleteBomLine,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useSetOfferingTaxClass(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetOfferingTaxClassData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, SetOfferingTaxClassData>({
    ...options,
    mutationFn: setOfferingTaxClass,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useSetVariantTaxClass(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetVariantTaxClassData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, SetVariantTaxClassData>({
    ...options,
    mutationFn: setVariantTaxClass,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useClearVariantTaxClass(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: clearVariantTaxClass,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useAddSuggestedComponent(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: addSuggestedComponent,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteVariant(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteVariant,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
