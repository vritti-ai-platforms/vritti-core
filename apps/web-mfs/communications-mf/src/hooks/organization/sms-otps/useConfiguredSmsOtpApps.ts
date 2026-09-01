import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_SMS_OTPS } from '@vritti/communications-permissions/sms-otps';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { ConfiguredSmsOtpAppData } from '@/schemas/sms-otps';
import { getConfiguredSmsOtpApps } from '@/services/organization/sms-otps.service';
import { CONFIGURED_SMS_OTP_APPS_KEY } from './keys';

export function useConfiguredSmsOtpApps(
  options?: Omit<UseQueryOptions<ConfiguredSmsOtpAppData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_SMS_OTPS.configuredApps.view);

  return useQuery<ConfiguredSmsOtpAppData[], AxiosError>({
    queryKey: CONFIGURED_SMS_OTP_APPS_KEY,
    queryFn: getConfiguredSmsOtpApps,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
