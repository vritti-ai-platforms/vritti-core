import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_SMS_OTPS } from '@vritti/communications-permissions/sms-otps';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { SmsOtpStatsData } from '@/schemas/sms-otps';
import { getSmsOtpStats } from '@/services/organization/sms-otps.service';
import { SMS_OTP_STATS_KEY } from './keys';

export function useSmsOtpStats(options?: Omit<UseQueryOptions<SmsOtpStatsData, AxiosError>, 'queryKey' | 'queryFn'>) {
  const { available } = usePermission(ORG_SMS_OTPS.stats.view);

  return useQuery<SmsOtpStatsData, AxiosError>({
    queryKey: SMS_OTP_STATS_KEY,
    queryFn: getSmsOtpStats,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
