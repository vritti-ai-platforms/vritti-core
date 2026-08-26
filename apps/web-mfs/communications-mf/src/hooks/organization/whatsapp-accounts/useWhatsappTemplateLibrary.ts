import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { TemplateLibraryItemData } from '@/schemas/whatsapp-templates';
import {
  getWhatsappTemplateLibrary,
  type TemplateLibraryFilters,
} from '@/services/organization/whatsapp-templates.service';
import { WHATSAPP_ACCOUNT_TEMPLATES_KEY } from './keys';

// Browses Meta's pre-approved template library, keyed by the active filters
export function useWhatsappTemplateLibrary(
  accountId: string,
  filters: TemplateLibraryFilters,
  options?: Omit<UseQueryOptions<TemplateLibraryItemData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  // Library browsing is part of the add flow — the gateway gates it the same way
  const { available } = usePermission(ORG_WHATSAPP_ACCOUNTS.templates.add);

  return useQuery<TemplateLibraryItemData[], AxiosError>({
    queryKey: [
      ...WHATSAPP_ACCOUNT_TEMPLATES_KEY(accountId),
      'library',
      filters.category ?? '',
      filters.language ?? '',
      filters.search ?? '',
    ],
    queryFn: () => getWhatsappTemplateLibrary(accountId, filters),
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
