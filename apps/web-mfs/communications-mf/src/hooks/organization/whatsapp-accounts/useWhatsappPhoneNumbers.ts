import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { WhatsappPhoneNumbersTableResponse } from '@/schemas/whatsapp-phone-numbers';
import { getWhatsappPhoneNumbersTable } from '@/services/organization/whatsapp-phone-numbers.service';
import { WHATSAPP_ACCOUNT_PHONE_NUMBERS_KEY } from './keys';

// Fetches the WABA's phone numbers table — rows are read live from Meta, so status and quality
// are always current
export function useWhatsappPhoneNumbers(
  accountId: string,
  options?: Omit<UseQueryOptions<WhatsappPhoneNumbersTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_WHATSAPP_ACCOUNTS.phoneNumbers.view);

  return useQuery<WhatsappPhoneNumbersTableResponse, AxiosError>({
    queryKey: WHATSAPP_ACCOUNT_PHONE_NUMBERS_KEY(accountId),
    queryFn: () => getWhatsappPhoneNumbersTable(accountId),
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
