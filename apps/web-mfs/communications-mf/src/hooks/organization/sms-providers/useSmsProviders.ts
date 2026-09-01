import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_SMS_PROVIDERS } from '@vritti/communications-permissions/sms-providers';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { SmsProvidersTableResponse } from '@/schemas/sms-providers';
import { getSmsProvidersTable } from '@/services/organization/sms-providers.service';
import { SMS_PROVIDERS_TABLE_KEY } from './keys';

export function useSmsProviders(
  options?: Omit<UseQueryOptions<SmsProvidersTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_SMS_PROVIDERS.view);

  return useQuery<SmsProvidersTableResponse, AxiosError>({
    queryKey: SMS_PROVIDERS_TABLE_KEY,
    queryFn: getSmsProvidersTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
