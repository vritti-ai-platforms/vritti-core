import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { OfferingChannelTypeData } from '@/schemas/offerings';
import { getOfferingChannels } from '@/services/organization/offerings.service';
import { OFFERING_CHANNELS_KEY } from './keys';

// Where this offering sells, and how much of it each channel carries
export function useOfferingChannels(
  offeringId: string,
  options?: Omit<UseQueryOptions<OfferingChannelTypeData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_OFFERINGS.channels.view);
  return useQuery<OfferingChannelTypeData[], AxiosError>({
    queryKey: [...OFFERING_CHANNELS_KEY(offeringId)],
    queryFn: () => getOfferingChannels(offeringId),
    ...options,
    enabled: available && !!offeringId && (options?.enabled ?? true),
  });
}
