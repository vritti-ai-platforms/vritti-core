import type { UseCreateVariantInventoryItem } from '../inventory-items/types';
import type {
  OfferingPermissions,
  UseAddBomLine,
  UseAddSuggestedComponent,
  UseBulkSetOfferingsStatus,
  UseBulkSetVariantsStatus,
  UseClearVariantFulfilment,
  UseClearVariantTaxClass,
  UseCreateDimension,
  UseCreateDimensionFromTemplate,
  UseCreateOffering,
  UseCreateVariant,
  UseDeleteBomLine,
  UseDeleteDimension,
  UseDeleteOffering,
  UseDeleteVariant,
  UseGenerateVariants,
  UseOfferingDimensions,
  UseOfferingsTable,
  UseOfferingVariantsTable,
  UsePreviewVariantCombinations,
  UseReorderDimensions,
  UseSetOfferingFulfilment,
  UseSetOfferingStatus,
  UseSetOfferingTaxClass,
  UseSetVariantFulfilment,
  UseSetVariantTaxClass,
  UseSuspenseOffering,
  UseSuspenseVariant,
  UseUpdateBomLine,
  UseUpdateDimension,
  UseUpdateOffering,
  UseUpdateVariant,
  UseUpsertDimensionValues,
} from './types';

export interface OfferingsBinding {
  permissions: OfferingPermissions;
  // Shown under the page title — the only copy that differs between scopes
  listDescription: string;
  tableKey: readonly unknown[];
  // Must byte-match the gateway's getCurrentState key or the user's saved view silently resets
  tableSlug: string;
  variantsTableKey: (offeringId: string) => readonly unknown[];
  variantsTableSlug: (offeringId: string) => string;

  useOfferingsTable: UseOfferingsTable;
  useOffering: UseSuspenseOffering;
  useCreateOffering: UseCreateOffering;
  useUpdateOffering: UseUpdateOffering;
  useDeleteOffering: UseDeleteOffering;
  useSetOfferingStatus: UseSetOfferingStatus;
  useBulkSetOfferingsStatus: UseBulkSetOfferingsStatus;

  useDimensions: UseOfferingDimensions;
  useCreateDimension: UseCreateDimension;
  useCreateDimensionFromTemplate: UseCreateDimensionFromTemplate;
  useUpsertDimensionValues: UseUpsertDimensionValues;
  useUpdateDimension: UseUpdateDimension;
  useReorderDimensions: UseReorderDimensions;
  useDeleteDimension: UseDeleteDimension;

  useVariantsTable: UseOfferingVariantsTable;
  useVariant: UseSuspenseVariant;
  useCreateVariant: UseCreateVariant;
  useGenerateVariants: UseGenerateVariants;
  usePreviewVariantCombinations: UsePreviewVariantCombinations;
  useUpdateVariant: UseUpdateVariant;
  useBulkSetVariantsStatus: UseBulkSetVariantsStatus;
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

  // Organization only — a site enables org-owned items rather than creating them, and a company has
  // no inventory-items feature at all
  useCreateVariantInventoryItem?: UseCreateVariantInventoryItem;
}
