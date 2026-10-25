import { useQuery } from '@tanstack/react-query';
import { LE_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { OfferingDimensionData } from '@/schemas/offerings';
import { getDimensions } from '@/services/legal-entity/offerings.service';
import { OFFERINGS_KEY } from './keys';
import type { Options } from './options';

export function useOfferingDimensions(offeringId: string, options?: Options<OfferingDimensionData[]>) {
  const { available } = usePermission(LE_OFFERINGS.dimensions.view);
  return useQuery<OfferingDimensionData[], AxiosError>({
    queryKey: [...OFFERINGS_KEY, offeringId, 'dimensions'],
    queryFn: () => getDimensions(offeringId),
    ...options,
    enabled: available && !!offeringId && (options?.enabled ?? true),
  });
}
