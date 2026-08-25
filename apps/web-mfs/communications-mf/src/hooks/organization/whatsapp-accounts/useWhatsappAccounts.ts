import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { WhatsappAccountsTableResponse } from '@/schemas/whatsapp-accounts';
import { getWhatsappAccountsTable } from '@/services/organization/whatsapp-accounts.service';
import { WHATSAPP_ACCOUNTS_TABLE_KEY } from './keys';

// Fetches the WhatsApp accounts table. The key carries no page: the server reads the pushed table
// state, so a page change is an invalidation of this one key rather than a new key.
export function useWhatsappAccounts(
  options?: Omit<UseQueryOptions<WhatsappAccountsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_WHATSAPP_ACCOUNTS.view);

  return useQuery<WhatsappAccountsTableResponse, AxiosError>({
    queryKey: WHATSAPP_ACCOUNTS_TABLE_KEY,
    queryFn: getWhatsappAccountsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
