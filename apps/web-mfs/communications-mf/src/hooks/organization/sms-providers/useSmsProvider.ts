import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SmsProviderData } from '@/schemas/sms-providers';
import { getSmsProvider } from '@/services/organization/sms-providers.service';
import { SMS_PROVIDER_KEY } from './keys';

// Fetches an SMS provider by ID; suspends until data is available. Not self-gated on the view
// permission — useSuspenseQuery has no `enabled`; the route's PermissionGate keeps the GET off the wire.
export function useSmsProvider(id: string) {
  return useSuspenseQuery<SmsProviderData, AxiosError>({
    queryKey: SMS_PROVIDER_KEY(id),
    queryFn: () => getSmsProvider(id),
  });
}
