import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { WhatsappAccountData } from '@/schemas/whatsapp-accounts';
import { getWhatsappAccount } from '@/services/organization/whatsapp-accounts.service';
import { WHATSAPP_ACCOUNT_KEY } from './keys';

// Fetches a WhatsApp account by ID; suspends until data is available. Not self-gated on the view
// permission — useSuspenseQuery has no `enabled`. The guarded GET is kept off the wire by the
// PermissionGate on the `:accountId` route, which never mounts a caller lacking the permission.
export function useWhatsappAccount(id: string) {
  return useSuspenseQuery<WhatsappAccountData, AxiosError>({
    queryKey: WHATSAPP_ACCOUNT_KEY(id),
    queryFn: () => getWhatsappAccount(id),
  });
}
