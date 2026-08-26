import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { WhatsappTemplatesTableResponse } from '@/schemas/whatsapp-templates';
import { getWhatsappTemplatesTable } from '@/services/organization/whatsapp-templates.service';
import { WHATSAPP_ACCOUNT_TEMPLATES_KEY } from './keys';

// Fetches the WABA's message templates table — rows are read live from Meta, so review status
// and quality are always current
export function useWhatsappTemplates(
  accountId: string,
  options?: Omit<UseQueryOptions<WhatsappTemplatesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_WHATSAPP_ACCOUNTS.templates.view);

  return useQuery<WhatsappTemplatesTableResponse, AxiosError>({
    queryKey: WHATSAPP_ACCOUNT_TEMPLATES_KEY(accountId),
    queryFn: () => getWhatsappTemplatesTable(accountId),
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
