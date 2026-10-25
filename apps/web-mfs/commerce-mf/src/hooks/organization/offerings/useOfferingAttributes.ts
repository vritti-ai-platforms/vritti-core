import { useQuery } from '@tanstack/react-query';
import { ORG_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { OfferingAttributeData } from '@/schemas/offerings';
import { getAttributes } from '@/services/organization/offerings.service';
import { OFFERINGS_KEY } from './keys';
import type { Options } from './options';

export function useOfferingAttributes(offeringId: string, options?: Options<OfferingAttributeData[]>) {
  const { available } = usePermission(ORG_OFFERINGS.attributes.view);
  return useQuery<OfferingAttributeData[], AxiosError>({
    queryKey: [...OFFERINGS_KEY, offeringId, 'attributes'],
    queryFn: () => getAttributes(offeringId),
    ...options,
    enabled: available && !!offeringId && (options?.enabled ?? true),
  });
}
