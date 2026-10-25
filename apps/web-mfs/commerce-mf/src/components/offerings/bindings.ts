import type { UseCreateVariantInventoryItem } from '../inventory-items/types';
import type {
  OfferingPermissions,
  UseAddOfferingVariantBomLine,
  UseAddOfferingVariantSuggestedComponent,
  UseBulkClearOfferingVariantsTaxClass,
  UseBulkSetOfferingVariantsAttribute,
  UseBulkSetOfferingVariantsTaxClass,
  UseClearOfferingVariantFulfilment,
  UseClearOfferingVariantTaxClass,
  UseCreateOffering,
  UseCreateOfferingAttribute,
  UseCreateOfferingAttributeFromTemplate,
  UseCreateOfferingChannelPages,
  UseCreateOfferingDimension,
  UseCreateOfferingDimensionFromTemplate,
  UseCreateOfferingVariant,
  UseDeleteOffering,
  UseDeleteOfferingAttribute,
  UseDeleteOfferingDimension,
  UseDeleteOfferingVariant,
  UseDeleteOfferingVariantBomLine,
  UseGenerateOfferingVariants,
  UseMarkOfferingsActive,
  UseMarkOfferingsInactive,
  UseMarkOfferingVariantsActive,
  UseMarkOfferingVariantsInactive,
  UseOfferingAttributes,
  UseOfferingChannels,
  UseOfferingChannelVariantsTable,
  UseOfferingDimensions,
  UseOfferingsTable,
  UseOfferingVariantBom,
  UseOfferingVariantsTable,
  UsePreviewOfferingVariantCombinations,
  UseReorderOfferingAttributes,
  UseReorderOfferingDimensions,
  UseSetOfferingFulfilment,
  UseSetOfferingStatus,
  UseSetOfferingTargetAvailability,
  UseSetOfferingTaxClass,
  UseSetOfferingVariantAttributes,
  UseSetOfferingVariantFulfilment,
  UseSetOfferingVariantTaxClass,
  UseSuspenseOffering,
  UseSuspenseOfferingVariant,
  UseUpdateOffering,
  UseUpdateOfferingAttribute,
  UseUpdateOfferingDimension,
  UseUpdateOfferingVariant,
  UseUpdateOfferingVariantBomLine,
  UseUpsertOfferingAttributeValues,
  UseUpsertOfferingDimensionValues,
} from './types';

export interface OfferingsBinding {
  permissions: OfferingPermissions;
  listDescription: string;
  tableKey: readonly unknown[];
  tableSlug: string;
  variantsTableKey: (offeringId: string) => readonly unknown[];
  variantsTableSlug: (offeringId: string) => string;
  channelVariantsKey: (offeringId: string, targetId: string) => readonly unknown[];
  channelVariantsSlug: (offeringId: string, targetId: string) => string;
  exportEndpoint: string;
  variantsExportEndpoint: (offeringId: string) => string;

  useOfferingsTable: UseOfferingsTable;
  useOffering: UseSuspenseOffering;
  useCreateOffering: UseCreateOffering;
  useUpdateOffering: UseUpdateOffering;
  useDeleteOffering: UseDeleteOffering;
  useSetOfferingStatus: UseSetOfferingStatus;
  useMarkOfferingsActive: UseMarkOfferingsActive;
  useMarkOfferingsInactive: UseMarkOfferingsInactive;
  useSetOfferingTaxClass: UseSetOfferingTaxClass;
  useSetOfferingFulfilment: UseSetOfferingFulfilment;

  useOfferingAttributes: UseOfferingAttributes;
  useCreateOfferingAttribute: UseCreateOfferingAttribute;
  useCreateOfferingAttributeFromTemplate: UseCreateOfferingAttributeFromTemplate;
  useUpsertOfferingAttributeValues: UseUpsertOfferingAttributeValues;
  useUpdateOfferingAttribute: UseUpdateOfferingAttribute;
  useReorderOfferingAttributes: UseReorderOfferingAttributes;
  useDeleteOfferingAttribute: UseDeleteOfferingAttribute;
  useSetOfferingVariantAttributes: UseSetOfferingVariantAttributes;
  useBulkSetOfferingVariantsAttribute: UseBulkSetOfferingVariantsAttribute;

  useOfferingDimensions: UseOfferingDimensions;
  useCreateOfferingDimension: UseCreateOfferingDimension;
  useCreateOfferingDimensionFromTemplate: UseCreateOfferingDimensionFromTemplate;
  useUpsertOfferingDimensionValues: UseUpsertOfferingDimensionValues;
  useUpdateOfferingDimension: UseUpdateOfferingDimension;
  useReorderOfferingDimensions: UseReorderOfferingDimensions;
  useDeleteOfferingDimension: UseDeleteOfferingDimension;

  useOfferingVariantsTable: UseOfferingVariantsTable;
  useOfferingVariant: UseSuspenseOfferingVariant;
  useCreateOfferingVariant: UseCreateOfferingVariant;
  useGenerateOfferingVariants: UseGenerateOfferingVariants;
  usePreviewOfferingVariantCombinations: UsePreviewOfferingVariantCombinations;
  useUpdateOfferingVariant: UseUpdateOfferingVariant;
  useMarkOfferingVariantsActive: UseMarkOfferingVariantsActive;
  useMarkOfferingVariantsInactive: UseMarkOfferingVariantsInactive;
  useBulkClearOfferingVariantsTaxClass: UseBulkClearOfferingVariantsTaxClass;
  useBulkSetOfferingVariantsTaxClass: UseBulkSetOfferingVariantsTaxClass;
  useDeleteOfferingVariant: UseDeleteOfferingVariant;
  useSetOfferingVariantTaxClass: UseSetOfferingVariantTaxClass;
  useClearOfferingVariantTaxClass: UseClearOfferingVariantTaxClass;
  useSetOfferingVariantFulfilment: UseSetOfferingVariantFulfilment;
  useClearOfferingVariantFulfilment: UseClearOfferingVariantFulfilment;

  useOfferingVariantBom: UseOfferingVariantBom;
  useAddOfferingVariantBomLine: UseAddOfferingVariantBomLine;
  useUpdateOfferingVariantBomLine: UseUpdateOfferingVariantBomLine;
  useDeleteOfferingVariantBomLine: UseDeleteOfferingVariantBomLine;
  useAddOfferingVariantSuggestedComponent: UseAddOfferingVariantSuggestedComponent;
  useCreateOfferingVariantInventoryItem?: UseCreateVariantInventoryItem;

  useOfferingChannels: UseOfferingChannels;
  useOfferingChannelVariantsTable: UseOfferingChannelVariantsTable;
  useCreateOfferingChannelPages: UseCreateOfferingChannelPages;
  useSetOfferingTargetAvailability: UseSetOfferingTargetAvailability;
}
