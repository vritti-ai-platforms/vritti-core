import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  AddBomLineData,
  CreateDimensionData,
  CreateDimensionFromTemplateData,
  CreateOfferingData,
  CreateVariantData,
  DeleteBomLineData,
  GenerateVariantsData,
  OfferingData,
  OfferingDimensionData,
  OfferingsTableResponse,
  OfferingVariantData,
  OfferingVariantsTableResponse,
  PreviewCombinationsData,
  ReorderDimensionsData,
  SetOfferingFulfilmentData,
  SetOfferingTaxClassData,
  SetVariantFulfilmentData,
  SetVariantTaxClassData,
  UpdateBomLineData,
  UpdateDimensionData,
  UpdateOfferingFormData,
  UpsertDimensionValuesData,
  VariantCombinationsData,
} from '@/schemas/offerings';

export interface OfferingPermissions {
  featureCode: string;
  view: string;
  add: string;
  edit: string;
  delete: string;
  toggle: string;
  setTaxClass: string;
  dimensions: { view: string; add: string; addFromTemplate: string; edit: string; delete: string };
  // createInventoryItem is organization-only, so the shared shape leaves it optional
  variants: {
    view: string;
    add: string;
    edit: string;
    delete: string;
    setTaxClass: string;
    // createInventoryItem is organization-only, so the shared shape leaves it optional
    bom: {
      view: string;
      add: string;
      edit: string;
      delete: string;
      addFromSuggestion: string;
      createInventoryItem?: string;
    };
  };
}

// A dialog owns its own mutation because Form has no onSuccess — closing it on success has to be
// wired where the hook is called. So the scope's hook is handed over rather than its result.
type MutationHook<TData, TVars> = (
  options?: Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>,
) => UseMutationResult<TData, AxiosError, TVars>;

export type UseOfferingDimensions = (offeringId: string) => {
  data: OfferingDimensionData[] | undefined;
  isLoading: boolean;
};
export type UseOfferingVariantsTable = (offeringId: string) => {
  data: OfferingVariantsTableResponse | undefined;
  isLoading: boolean;
};
export type UseOfferingsTable = () => { data: OfferingsTableResponse | undefined; isLoading: boolean };

// Suspense-backed: the route renders a skeleton at its boundary, so `data` is always defined
export type UseSuspenseOffering = (id: string) => { data: OfferingData };
export type UseSuspenseVariant = (variantId: string) => { data: OfferingVariantData };

export type UseCreateOffering = MutationHook<CreateResponse<OfferingData>, CreateOfferingData>;
export type UseUpdateOffering = MutationHook<SuccessResponse, { id: string; data: UpdateOfferingFormData }>;
export type UseCreateDimension = MutationHook<CreateResponse<OfferingDimensionData>, CreateDimensionData>;
export type UseCreateDimensionFromTemplate = MutationHook<
  CreateResponse<OfferingDimensionData>,
  CreateDimensionFromTemplateData
>;
export type UseUpsertDimensionValues = MutationHook<SuccessResponse, UpsertDimensionValuesData>;
export type UseReorderDimensions = MutationHook<SuccessResponse, ReorderDimensionsData>;
export type UseUpdateDimension = MutationHook<SuccessResponse, UpdateDimensionData>;
export type UseDeleteDimension = MutationHook<SuccessResponse, string>;
export type UseCreateVariant = MutationHook<CreateResponse<OfferingVariantData>, CreateVariantData>;
export type UsePreviewVariantCombinations = MutationHook<VariantCombinationsData, PreviewCombinationsData>;
export type UseGenerateVariants = MutationHook<SuccessResponse, GenerateVariantsData>;
export type UseUpdateVariant = MutationHook<
  SuccessResponse,
  { id: string; data: { name?: string; externalSku?: string | null; isActive?: boolean } }
>;
export type UseSetOfferingTaxClass = MutationHook<SuccessResponse, SetOfferingTaxClassData>;
export type UseSetOfferingStatus = MutationHook<SuccessResponse, { id: string; isActive: boolean }>;
export type UseBulkSetOfferingsStatus = MutationHook<SuccessResponse, { ids: string[]; isActive: boolean }>;
export type UseBulkSetVariantsStatus = MutationHook<
  SuccessResponse,
  { offeringId: string; ids: string[]; isActive: boolean }
>;
export type UseSetOfferingFulfilment = MutationHook<SuccessResponse, SetOfferingFulfilmentData>;
export type UseSetVariantFulfilment = MutationHook<SuccessResponse, SetVariantFulfilmentData>;
export type UseClearVariantFulfilment = MutationHook<SuccessResponse, string>;
export type UseSetVariantTaxClass = MutationHook<SuccessResponse, SetVariantTaxClassData>;
export type UseClearVariantTaxClass = MutationHook<SuccessResponse, string>;
export type UseAddBomLine = MutationHook<SuccessResponse, AddBomLineData>;
export type UseUpdateBomLine = MutationHook<SuccessResponse, UpdateBomLineData>;
export type UseDeleteBomLine = MutationHook<SuccessResponse, DeleteBomLineData>;
export type UseAddSuggestedComponent = MutationHook<SuccessResponse, string>;
export type UseDeleteVariant = MutationHook<SuccessResponse, string>;
export type UseDeleteOffering = MutationHook<SuccessResponse, string>;
