import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import { getWhatsappTemplateLanguages } from '@/services/organization/whatsapp-templates.service';
import { WHATSAPP_ACCOUNT_TEMPLATES_KEY } from './keys';

// Distinct languages Meta's template library ships in — feeds the wizard's language selector
export function useWhatsappTemplateLanguages(
  accountId: string,
  options?: Omit<UseQueryOptions<string[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  // Feeds the create wizard only — the gateway gates it with templates.add the same way
  const { available } = usePermission(ORG_WHATSAPP_ACCOUNTS.templates.add);

  return useQuery<string[], AxiosError>({
    queryKey: [...WHATSAPP_ACCOUNT_TEMPLATES_KEY(accountId), 'library-languages'],
    queryFn: () => getWhatsappTemplateLanguages(accountId),
    staleTime: 5 * 60 * 1000,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
