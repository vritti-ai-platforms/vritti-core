import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_SMS_PROVIDERS } from '@vritti/communications-permissions/sms-providers';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { SmsProviderTemplatesTableResponse } from '@/schemas/sms-provider-templates';
import { getSmsProviderTemplatesTable } from '@/services/organization/sms-provider-templates.service';
import { SMS_PROVIDER_TEMPLATES_KEY } from './keys';

// Self-gated: the tab renders inside the provider detail page, which is reachable without the
// templates grant, so the query must not fire for someone who cannot read them
export function useSmsProviderTemplates(
  providerId: string,
  options?: Omit<UseQueryOptions<SmsProviderTemplatesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_SMS_PROVIDERS.templates.view);

  return useQuery<SmsProviderTemplatesTableResponse, AxiosError>({
    queryKey: SMS_PROVIDER_TEMPLATES_KEY(providerId),
    queryFn: () => getSmsProviderTemplatesTable(providerId),
    ...options,
    enabled: available && !!providerId && (options?.enabled ?? true),
  });
}
