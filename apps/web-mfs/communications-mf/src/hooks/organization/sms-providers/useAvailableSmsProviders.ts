import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_SMS_PROVIDERS } from '@vritti/communications-permissions/sms-providers';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { SmsProviderCapabilities } from '@/schemas/sms-providers';
import { getAvailableSmsProviders } from '@/services/organization/sms-providers.service';
import { SMS_PROVIDERS_AVAILABLE_KEY } from './keys';

// The connectable providers and what each supports. Rarely changes — it is a property of the
// deployed service, not of the organization — so it is cached hard.
export function useAvailableSmsProviders(
  options?: Omit<UseQueryOptions<SmsProviderCapabilities[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_SMS_PROVIDERS.view);

  return useQuery<SmsProviderCapabilities[], AxiosError>({
    queryKey: SMS_PROVIDERS_AVAILABLE_KEY,
    queryFn: getAvailableSmsProviders,
    staleTime: 30 * 60 * 1000,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
