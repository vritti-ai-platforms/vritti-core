import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_WHATSAPP_OTPS } from '@vritti/communications-permissions/whatsapp-otps';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { WhatsappOtpsTableResponse } from '@/schemas/whatsapp-otps';
import { getWhatsappOtpsTable } from '@/services/organization/whatsapp-otps.service';
import { WHATSAPP_OTPS_TABLE_KEY } from './keys';

// Fetches the sign-in codes table. The key carries no page: the server reads the pushed table state,
// so a page change is an invalidation of this one key rather than a new key.
export function useWhatsappOtps(
  options?: Omit<UseQueryOptions<WhatsappOtpsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_WHATSAPP_OTPS.view);

  return useQuery<WhatsappOtpsTableResponse, AxiosError>({
    queryKey: WHATSAPP_OTPS_TABLE_KEY,
    queryFn: getWhatsappOtpsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
