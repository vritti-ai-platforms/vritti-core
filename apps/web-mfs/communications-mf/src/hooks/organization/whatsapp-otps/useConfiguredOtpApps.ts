import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_WHATSAPP_OTPS } from '@vritti/communications-permissions/whatsapp-otps';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { ConfiguredOtpAppData } from '@/schemas/whatsapp-otps';
import { getConfiguredOtpApps } from '@/services/organization/whatsapp-otps.service';
import { WHATSAPP_OTPS_CONFIGURED_APPS_KEY } from './keys';

// Fetches the apps set up to send sign-in codes. Self-gated: the endpoint is guarded.
export function useConfiguredOtpApps(
  options?: Omit<UseQueryOptions<ConfiguredOtpAppData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_WHATSAPP_OTPS.configuredApps.view);

  return useQuery<ConfiguredOtpAppData[], AxiosError>({
    queryKey: WHATSAPP_OTPS_CONFIGURED_APPS_KEY,
    queryFn: getConfiguredOtpApps,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
