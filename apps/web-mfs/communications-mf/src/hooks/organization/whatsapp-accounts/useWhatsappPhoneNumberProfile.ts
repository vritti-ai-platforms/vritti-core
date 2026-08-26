import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { WhatsappPhoneNumberProfileData } from '@/schemas/whatsapp-phone-numbers';
import { getWhatsappPhoneNumberProfile } from '@/services/organization/whatsapp-phone-numbers.service';
import { WHATSAPP_PHONE_NUMBER_PROFILE_KEY } from './keys';

// Fetches the number's business profile live from Meta
export function useWhatsappPhoneNumberProfile(
  accountId: string,
  phoneNumberId: string,
  options?: Omit<UseQueryOptions<WhatsappPhoneNumberProfileData, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_WHATSAPP_ACCOUNTS.phoneNumbers.view);

  return useQuery<WhatsappPhoneNumberProfileData, AxiosError>({
    queryKey: WHATSAPP_PHONE_NUMBER_PROFILE_KEY(accountId, phoneNumberId),
    queryFn: () => getWhatsappPhoneNumberProfile(accountId, phoneNumberId),
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
