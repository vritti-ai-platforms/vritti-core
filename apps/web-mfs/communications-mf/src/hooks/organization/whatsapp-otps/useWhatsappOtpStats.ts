import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_WHATSAPP_OTPS } from '@vritti/communications-permissions/whatsapp-otps';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { WhatsappOtpStatsData } from '@/schemas/whatsapp-otps';
import { getWhatsappOtpStats } from '@/services/organization/whatsapp-otps.service';
import { WHATSAPP_OTPS_STATS_KEY } from './keys';

// Fetches the last 30 days of aggregates. Self-gated: the endpoint is guarded, so a denied user
// must never fire it and 403 into the error boundary.
export function useWhatsappOtpStats(
  options?: Omit<UseQueryOptions<WhatsappOtpStatsData, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_WHATSAPP_OTPS.stats.view);

  return useQuery<WhatsappOtpStatsData, AxiosError>({
    queryKey: WHATSAPP_OTPS_STATS_KEY,
    queryFn: getWhatsappOtpStats,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
