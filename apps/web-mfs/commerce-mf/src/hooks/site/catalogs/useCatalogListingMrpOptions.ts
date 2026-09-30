import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type CatalogListingMrpOption, getCatalogListingMrpOptions } from '@/services/site/catalogs.service';
import { CATALOGS_KEY } from './keys';

export function useCatalogListingMrpOptions(offeringVariantId: string | undefined) {
  return useQuery<CatalogListingMrpOption[], AxiosError>({
    queryKey: [...CATALOGS_KEY, 'mrp-options', offeringVariantId],
    queryFn: () => getCatalogListingMrpOptions(offeringVariantId as string),
    enabled: Boolean(offeringVariantId),
  });
}
