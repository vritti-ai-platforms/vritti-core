import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { EmbeddedSignupConfigData } from '@/schemas/whatsapp-accounts';
import { getEmbeddedSignupConfig } from '@/services/organization/whatsapp-accounts.service';
import { WHATSAPP_EMBEDDED_SIGNUP_CONFIG_KEY } from './keys';

// Deployment configuration for the signup popup. Gated on `add` exactly as the gateway route is —
// it is only ever needed to start a connect.
export function useEmbeddedSignupConfig(
  options?: Omit<UseQueryOptions<EmbeddedSignupConfigData, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_WHATSAPP_ACCOUNTS.add);

  return useQuery<EmbeddedSignupConfigData, AxiosError>({
    queryKey: WHATSAPP_EMBEDDED_SIGNUP_CONFIG_KEY,
    queryFn: getEmbeddedSignupConfig,
    // Fixed per deployment — refetching it would never return anything different
    staleTime: Number.POSITIVE_INFINITY,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
