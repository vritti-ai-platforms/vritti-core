import type { UseMutationOptions, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  AddBomLineData,
  BulkSetVariantsAttributeData,
  ChannelVariantsTableResponse,
  CreateAttributeData,
  CreateAttributeFromTemplateData,
  CreateChannelPagesData,
  CreateDimensionData,
  CreateDimensionFromTemplateData,
  CreateOfferingData,
  CreateVariantData,
  DeleteBomLineData,
  GenerateVariantsData,
  OfferingAttributeData,
  OfferingChannelTypeData,
  OfferingData,
  OfferingDimensionData,
  OfferingsTableResponse,
  OfferingVariantData,
  OfferingVariantsTableResponse,
  PreviewCombinationsData,
  ReorderAttributesData,
  ReorderDimensionsData,
  SetOfferingFulfilmentData,
  SetOfferingTaxClassData,
  SetTargetAvailabilityData,
  SetVariantAttributesData,
  SetVariantFulfilmentData,
  SetVariantTaxClassData,
  UpdateAttributeData,
  UpdateBomLineData,
  UpdateDimensionData,
  UpdateOfferingFormData,
  UpsertAttributeValuesData,
  UpsertDimensionValuesData,
  VariantBomData,
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
  export: string;
  channels: { view: string; createPage: string; setAvailability: string };
  dimensions: { view: string; add: string; addFromTemplate: string; edit: string; delete: string };
  attributes: { view: string; add: string; addFromTemplate: string; edit: string; delete: string };
  variants: {
    view: string;
    add: string;
    edit: string;
    delete: string;
    setTaxClass: string;
    setAttributes: string;
    export: string;
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

type MutationHook<TData, TVars> = (
  options?: Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>,
) => UseMutationResult<TData, AxiosError, TVars>;

export type UseOfferingDimensions = (offeringId: string) => {
  data: OfferingDimensionData[] | undefined;
  isLoading: boolean;
};
export type UseOfferingAttributes = (offeringId: string) => {
  data: OfferingAttributeData[] | undefined;
  isLoading: boolean;
};
export type UseOfferingVariantsTable = (offeringId: string) => {
  data: OfferingVariantsTableResponse | undefined;
  isLoading: boolean;
};
export type UseOfferingsTable = () => { data: OfferingsTableResponse | undefined; isLoading: boolean };

export type UseSuspenseOffering = (id: string) => { data: OfferingData };
export type UseSuspenseVariant = (variantId: string) => { data: OfferingVariantData };
export type UseVariantBom = (variantId: string) => {
  data: VariantBomData | undefined;
  isLoading: boolean;
};

export type UseCreateOffering = MutationHook<CreateResponse<OfferingData>, CreateOfferingData>;
export type UseUpdateOffering = MutationHook<SuccessResponse, { id: string; data: UpdateOfferingFormData }>;
export type UseCreateDimension = MutationHook<CreateResponse<OfferingDimensionData>, CreateDimensionData>;
export type UseCreateAttribute = MutationHook<CreateResponse<OfferingAttributeData>, CreateAttributeData>;
export type UseCreateDimensionFromTemplate = MutationHook<
  CreateResponse<OfferingDimensionData>,
  CreateDimensionFromTemplateData
>;
export type UseCreateAttributeFromTemplate = MutationHook<
  CreateResponse<OfferingAttributeData>,
  CreateAttributeFromTemplateData
>;
export type UseUpsertDimensionValues = MutationHook<SuccessResponse, UpsertDimensionValuesData>;
export type UseUpsertAttributeValues = MutationHook<SuccessResponse, UpsertAttributeValuesData>;

export type UseSetVariantAttributes = MutationHook<SuccessResponse, SetVariantAttributesData>;

export type UseBulkSetVariantsAttribute = MutationHook<SuccessResponse, BulkSetVariantsAttributeData>;
export type UseReorderDimensions = MutationHook<SuccessResponse, ReorderDimensionsData>;
export type UseReorderAttributes = MutationHook<SuccessResponse, ReorderAttributesData>;
export type UseUpdateDimension = MutationHook<SuccessResponse, UpdateDimensionData>;
export type UseUpdateAttribute = MutationHook<SuccessResponse, UpdateAttributeData>;
export type UseDeleteDimension = MutationHook<SuccessResponse, string>;
export type UseDeleteAttribute = MutationHook<SuccessResponse, string>;
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
export type UseBulkClearVariantsTaxClass = MutationHook<SuccessResponse, { offeringId: string; ids: string[] }>;
export type UseBulkSetVariantsTaxClass = MutationHook<
  SuccessResponse,
  { offeringId: string; ids: string[]; taxClassId: string }
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

export type UseOfferingChannels = (offeringId: string) => UseQueryResult<OfferingChannelTypeData[], AxiosError>;
export type UseChannelVariantsTable = (
  offeringId: string,
  channelType: string,
  targetId: string,
) => UseQueryResult<ChannelVariantsTableResponse, AxiosError>;
export type UseCreateChannelPages = (options?: {
  onSuccess?: () => void;
}) => UseMutationResult<SuccessResponse, AxiosError, CreateChannelPagesData>;

export type UseSetTargetAvailability = (options?: {
  onSuccess?: () => void;
}) => UseMutationResult<SuccessResponse, AxiosError, SetTargetAvailabilityData>;
