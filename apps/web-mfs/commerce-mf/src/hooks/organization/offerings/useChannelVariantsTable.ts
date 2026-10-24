import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { ChannelVariantsTableResponse } from '@/schemas/offerings';
import { getChannelVariantsTable } from '@/services/organization/offerings.service';
import { CHANNEL_VARIANTS_KEY } from './keys';

// This offering's variants as one storefront sees them — the rows of that app's table
export function useChannelVariantsTable(
  offeringId: string,
  targetId: string,
  options?: Omit<UseQueryOptions<ChannelVariantsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_OFFERINGS.channels.view);
  return useQuery<ChannelVariantsTableResponse, AxiosError>({
    queryKey: [...CHANNEL_VARIANTS_KEY(offeringId, targetId)],
    queryFn: () => getChannelVariantsTable(offeringId, targetId),
    ...options,
    enabled: available && !!offeringId && !!targetId && (options?.enabled ?? true),
  });
}
