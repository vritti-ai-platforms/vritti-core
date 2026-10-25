import { useQuery } from '@tanstack/react-query';
import { SITE_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { OfferingsTableResponse } from '@/schemas/offerings';
import { getOfferingsTable } from '@/services/site/offerings.service';
import { SITE_OFFERINGS_TABLE_KEY } from './keys';
import type { Options } from './options';

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
