import { useQuery } from '@tanstack/react-query';
import { LE_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { OfferingVariantsTableResponse } from '@/schemas/offerings';
import { getVariantsTable } from '@/services/legal-entity/offerings.service';
import { LE_OFFERING_VARIANTS_TABLE_KEY } from './keys';
import type { Options } from './options';

// One page of an offering's variants plus that table's saved view state
export function useOfferingVariantsTable(offeringId: string, options?: Options<OfferingVariantsTableResponse>) {
  const { available } = usePermission(LE_OFFERINGS.variants.view);
  return useQuery<OfferingVariantsTableResponse, AxiosError>({
    queryKey: [...LE_OFFERING_VARIANTS_TABLE_KEY(offeringId)],
    queryFn: () => getVariantsTable(offeringId),
    ...options,
    enabled: available && !!offeringId && (options?.enabled ?? true),
  });
}
