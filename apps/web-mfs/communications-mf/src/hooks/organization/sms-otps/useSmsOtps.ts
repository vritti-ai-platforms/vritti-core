import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_SMS_OTPS } from '@vritti/communications-permissions/sms-otps';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { SmsOtpsTableResponse } from '@/schemas/sms-otps';
import { getSmsOtpsTable } from '@/services/organization/sms-otps.service';
import { SMS_OTPS_TABLE_KEY } from './keys';

export function useSmsOtps(options?: Omit<UseQueryOptions<SmsOtpsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  const { available } = usePermission(ORG_SMS_OTPS.view);

  return useQuery<SmsOtpsTableResponse, AxiosError>({
    queryKey: SMS_OTPS_TABLE_KEY,
    queryFn: getSmsOtpsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
