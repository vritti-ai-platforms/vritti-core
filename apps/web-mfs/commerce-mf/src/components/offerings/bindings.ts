import type { UseCreateVariantInventoryItem } from '../inventory-items/types';
import type {
  OfferingPermissions,
  UseAddBomLine,
  UseAddSuggestedComponent,
  UseBulkClearVariantsTaxClass,
  UseBulkSetOfferingsStatus,
  UseBulkSetVariantsAttribute,
  UseBulkSetVariantsStatus,
  UseBulkSetVariantsTaxClass,
  UseClearVariantFulfilment,
  UseClearVariantTaxClass,
  UseCreateAttribute,
  UseCreateAttributeFromTemplate,
  UseCreateDimension,
  UseCreateDimensionFromTemplate,
  UseCreateOffering,
  UseCreateVariant,
  UseDeleteAttribute,
  UseDeleteBomLine,
  UseDeleteDimension,
  UseDeleteOffering,
  UseDeleteVariant,
  UseGenerateVariants,
  UseOfferingAttributes,
  UseOfferingDimensions,
  UseOfferingsTable,
  UseOfferingVariantsTable,
  UsePreviewVariantCombinations,
  UseReorderAttributes,
  UseReorderDimensions,
  UseSetOfferingFulfilment,
  UseSetOfferingStatus,
  UseSetOfferingTaxClass,
  UseSetVariantAttributes,
  UseSetVariantFulfilment,
  UseSetVariantTaxClass,
  UseSuspenseOffering,
  UseSuspenseVariant,
  UseUpdateAttribute,
  UseUpdateBomLine,
  UseUpdateDimension,
  UseUpdateOffering,
  UseUpdateVariant,
  UseUpsertAttributeValues,
  UseUpsertDimensionValues,
  UseVariantBom,
} from './types';

export interface OfferingsBinding {
  permissions: OfferingPermissions;
  listDescription: string;
  tableKey: readonly unknown[];
  tableSlug: string;
  variantsTableKey: (offeringId: string) => readonly unknown[];
  variantsTableSlug: (offeringId: string) => string;
  exportEndpoint: string;
  variantsExportEndpoint: (offeringId: string) => string;

  useOfferingsTable: UseOfferingsTable;
  useOffering: UseSuspenseOffering;
  useCreateOffering: UseCreateOffering;
  useUpdateOffering: UseUpdateOffering;
  useDeleteOffering: UseDeleteOffering;
  useSetOfferingStatus: UseSetOfferingStatus;
  useBulkSetOfferingsStatus: UseBulkSetOfferingsStatus;

  useAttributes: UseOfferingAttributes;
  useCreateAttribute: UseCreateAttribute;
  useCreateAttributeFromTemplate: UseCreateAttributeFromTemplate;
  useUpsertAttributeValues: UseUpsertAttributeValues;
  useUpdateAttribute: UseUpdateAttribute;
  useReorderAttributes: UseReorderAttributes;
  useDeleteAttribute: UseDeleteAttribute;
  useSetVariantAttributes: UseSetVariantAttributes;
  useBulkSetVariantsAttribute: UseBulkSetVariantsAttribute;

  useDimensions: UseOfferingDimensions;
  useCreateDimension: UseCreateDimension;
  useCreateDimensionFromTemplate: UseCreateDimensionFromTemplate;
  useUpsertDimensionValues: UseUpsertDimensionValues;
  useUpdateDimension: UseUpdateDimension;
  useReorderDimensions: UseReorderDimensions;
  useDeleteDimension: UseDeleteDimension;

  useVariantsTable: UseOfferingVariantsTable;
  useVariant: UseSuspenseVariant;
  useVariantBom: UseVariantBom;
  useCreateVariant: UseCreateVariant;
  useGenerateVariants: UseGenerateVariants;
  usePreviewVariantCombinations: UsePreviewVariantCombinations;
  useUpdateVariant: UseUpdateVariant;
  useBulkSetVariantsStatus: UseBulkSetVariantsStatus;
  useBulkClearVariantsTaxClass: UseBulkClearVariantsTaxClass;
  useBulkSetVariantsTaxClass: UseBulkSetVariantsTaxClass;
  useDeleteVariant: UseDeleteVariant;
  useSetOfferingTaxClass: UseSetOfferingTaxClass;
  useSetVariantTaxClass: UseSetVariantTaxClass;
  useSetOfferingFulfilment: UseSetOfferingFulfilment;
  useSetVariantFulfilment: UseSetVariantFulfilment;
  useClearVariantFulfilment: UseClearVariantFulfilment;
  useClearVariantTaxClass: UseClearVariantTaxClass;
  useAddBomLine: UseAddBomLine;
  useUpdateBomLine: UseUpdateBomLine;
  useDeleteBomLine: UseDeleteBomLine;
  useAddSuggestedComponent: UseAddSuggestedComponent;

  useCreateVariantInventoryItem?: UseCreateVariantInventoryItem;
}
