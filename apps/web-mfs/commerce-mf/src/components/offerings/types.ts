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
export type UseSuspenseOfferingVariant = (variantId: string) => { data: OfferingVariantData };
export type UseOfferingVariantBom = (variantId: string) => {
  data: VariantBomData | undefined;
  isLoading: boolean;
};

export type UseCreateOffering = MutationHook<CreateResponse<OfferingData>, CreateOfferingData>;
export type UseUpdateOffering = MutationHook<SuccessResponse, { id: string; data: UpdateOfferingFormData }>;
export type UseCreateOfferingDimension = MutationHook<CreateResponse<OfferingDimensionData>, CreateDimensionData>;
export type UseCreateOfferingAttribute = MutationHook<CreateResponse<OfferingAttributeData>, CreateAttributeData>;
export type UseCreateOfferingDimensionFromTemplate = MutationHook<
  CreateResponse<OfferingDimensionData>,
  CreateDimensionFromTemplateData
>;
export type UseCreateOfferingAttributeFromTemplate = MutationHook<
  CreateResponse<OfferingAttributeData>,
  CreateAttributeFromTemplateData
>;
export type UseUpsertOfferingDimensionValues = MutationHook<SuccessResponse, UpsertDimensionValuesData>;
export type UseUpsertOfferingAttributeValues = MutationHook<SuccessResponse, UpsertAttributeValuesData>;

export type UseSetOfferingVariantAttributes = MutationHook<SuccessResponse, SetVariantAttributesData>;

export type UseBulkSetOfferingVariantsAttribute = MutationHook<SuccessResponse, BulkSetVariantsAttributeData>;
export type UseReorderOfferingDimensions = MutationHook<SuccessResponse, ReorderDimensionsData>;
export type UseReorderOfferingAttributes = MutationHook<SuccessResponse, ReorderAttributesData>;
export type UseUpdateOfferingDimension = MutationHook<SuccessResponse, UpdateDimensionData>;
export type UseUpdateOfferingAttribute = MutationHook<SuccessResponse, UpdateAttributeData>;
export type UseDeleteOfferingDimension = MutationHook<SuccessResponse, string>;
export type UseDeleteOfferingAttribute = MutationHook<SuccessResponse, string>;
export type UseCreateOfferingVariant = MutationHook<CreateResponse<OfferingVariantData>, CreateVariantData>;
export type UsePreviewOfferingVariantCombinations = MutationHook<VariantCombinationsData, PreviewCombinationsData>;
export type UseGenerateOfferingVariants = MutationHook<SuccessResponse, GenerateVariantsData>;
export type UseUpdateOfferingVariant = MutationHook<
  SuccessResponse,
  { id: string; data: { name?: string; externalSku?: string | null; isActive?: boolean } }
>;
export type UseSetOfferingTaxClass = MutationHook<SuccessResponse, SetOfferingTaxClassData>;
export type UseSetOfferingStatus = MutationHook<SuccessResponse, { id: string; isActive: boolean }>;
export type UseBulkSetOfferingsStatus = MutationHook<SuccessResponse, { ids: string[]; isActive: boolean }>;
export type UseBulkSetOfferingVariantsStatus = MutationHook<
  SuccessResponse,
  { offeringId: string; ids: string[]; isActive: boolean }
>;
export type UseBulkClearOfferingVariantsTaxClass = MutationHook<SuccessResponse, { offeringId: string; ids: string[] }>;
export type UseBulkSetOfferingVariantsTaxClass = MutationHook<
  SuccessResponse,
  { offeringId: string; ids: string[]; taxClassId: string }
>;
export type UseSetOfferingFulfilment = MutationHook<SuccessResponse, SetOfferingFulfilmentData>;
export type UseSetOfferingVariantFulfilment = MutationHook<SuccessResponse, SetVariantFulfilmentData>;
export type UseClearOfferingVariantFulfilment = MutationHook<SuccessResponse, string>;
export type UseSetOfferingVariantTaxClass = MutationHook<SuccessResponse, SetVariantTaxClassData>;
export type UseClearOfferingVariantTaxClass = MutationHook<SuccessResponse, string>;
export type UseAddOfferingVariantBomLine = MutationHook<SuccessResponse, AddBomLineData>;
export type UseUpdateOfferingVariantBomLine = MutationHook<SuccessResponse, UpdateBomLineData>;
export type UseDeleteOfferingVariantBomLine = MutationHook<SuccessResponse, DeleteBomLineData>;
export type UseAddOfferingVariantSuggestedComponent = MutationHook<SuccessResponse, string>;
export type UseDeleteOfferingVariant = MutationHook<SuccessResponse, string>;
export type UseDeleteOffering = MutationHook<SuccessResponse, string>;

export type UseOfferingChannels = (offeringId: string) => UseQueryResult<OfferingChannelTypeData[], AxiosError>;
export type UseOfferingChannelVariantsTable = (
  offeringId: string,
  channelType: string,
  targetId: string,
) => UseQueryResult<ChannelVariantsTableResponse, AxiosError>;
export type UseCreateOfferingChannelPages = (options?: {
  onSuccess?: () => void;
}) => UseMutationResult<SuccessResponse, AxiosError, CreateChannelPagesData>;

export type UseSetOfferingTargetAvailability = (options?: {
  onSuccess?: () => void;
}) => UseMutationResult<SuccessResponse, AxiosError, SetTargetAvailabilityData>;
