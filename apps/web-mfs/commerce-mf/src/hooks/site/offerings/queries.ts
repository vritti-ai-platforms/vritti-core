import { type UseQueryOptions, type UseSuspenseQueryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { SITE_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type {
  OfferingData,
  OfferingDimensionData,
  OfferingsTableResponse,
  OfferingVariantData,
  OfferingVariantsTableResponse,
} from '@/schemas/offerings';
import {
  getDimensions,
  getOffering,
  getOfferingsTable,
  getVariant,
  getVariantsTable,
} from '@/services/site/offerings.service';
import { OFFERINGS_KEY, SITE_OFFERING_VARIANTS_TABLE_KEY, SITE_OFFERINGS_TABLE_KEY, VARIANT_KEY } from './keys';

type Options<T> = Omit<UseQueryOptions<T, AxiosError>, 'queryKey' | 'queryFn'>;
type SuspenseOptions<T> = Omit<UseSuspenseQueryOptions<T, AxiosError>, 'queryKey' | 'queryFn'>;

// One page of offerings plus the saved table view state — the server owns paging, sorting and filters
export function useOfferingsTable(options?: Options<OfferingsTableResponse>) {
  const { available } = usePermission(SITE_OFFERINGS.view);
  return useQuery<OfferingsTableResponse, AxiosError>({
    queryKey: [...SITE_OFFERINGS_TABLE_KEY],
    queryFn: getOfferingsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}

// Suspense-backed: the detail route renders a skeleton at its boundary, so the page never handles
// a loading state and `data` is always defined
export function useOffering(id: string, options?: SuspenseOptions<OfferingData>) {
  return useSuspenseQuery<OfferingData, AxiosError>({
    queryKey: [...OFFERINGS_KEY, id],
    queryFn: () => getOffering(id),
    ...options,
  });
}

export function useOfferingDimensions(offeringId: string, options?: Options<OfferingDimensionData[]>) {
  const { available } = usePermission(SITE_OFFERINGS.dimensions.view);
  return useQuery<OfferingDimensionData[], AxiosError>({
    queryKey: [...OFFERINGS_KEY, offeringId, 'dimensions'],
    queryFn: () => getDimensions(offeringId),
    ...options,
    enabled: available && !!offeringId && (options?.enabled ?? true),
  });
}

// One page of an offering's variants plus that table's saved view state
export function useOfferingVariantsTable(offeringId: string, options?: Options<OfferingVariantsTableResponse>) {
  const { available } = usePermission(SITE_OFFERINGS.variants.view);
  return useQuery<OfferingVariantsTableResponse, AxiosError>({
    queryKey: [...SITE_OFFERING_VARIANTS_TABLE_KEY(offeringId)],
    queryFn: () => getVariantsTable(offeringId),
    ...options,
    enabled: available && !!offeringId && (options?.enabled ?? true),
  });
}

// Suspense-backed: the variant route renders a skeleton at its boundary, so `data` is always defined
export function useVariant(variantId: string, options?: SuspenseOptions<OfferingVariantData>) {
  return useSuspenseQuery<OfferingVariantData, AxiosError>({
    queryKey: [...VARIANT_KEY(variantId)],
    queryFn: () => getVariant(variantId),
    ...options,
  });
}
