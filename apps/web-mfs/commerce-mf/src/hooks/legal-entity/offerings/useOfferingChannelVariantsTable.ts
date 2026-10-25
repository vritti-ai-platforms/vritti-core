import { useQuery } from '@tanstack/react-query';
import { LE_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { ChannelVariantsTableResponse } from '@/schemas/offerings';
import { getChannelVariantsTable } from '@/services/legal-entity/offerings.service';
import { CHANNEL_VARIANTS_KEY } from './keys';
import type { Options } from './options';

// This offering's variants as one storefront sees them — the rows of that app's table
export function useChannelVariantsTable(
  offeringId: string,
  channelType: string,
  targetId: string,
  options?: Options<ChannelVariantsTableResponse>,
) {
  const { available } = usePermission(LE_OFFERINGS.channels.view);
  return useQuery<ChannelVariantsTableResponse, AxiosError>({
    queryKey: [...CHANNEL_VARIANTS_KEY(offeringId, targetId)],
    queryFn: () => getChannelVariantsTable(offeringId, channelType, targetId),
    ...options,
    enabled: available && !!offeringId && !!targetId && (options?.enabled ?? true),
  });
}
