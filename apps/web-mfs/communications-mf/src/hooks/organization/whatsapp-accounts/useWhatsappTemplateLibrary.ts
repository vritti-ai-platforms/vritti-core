import { useInfiniteQuery } from '@tanstack/react-query';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import { useMemo } from 'react';
import type { TemplateLibraryPageData } from '@/schemas/whatsapp-templates';
import {
  getWhatsappTemplateLibrary,
  type TemplateLibraryFilters,
} from '@/services/organization/whatsapp-templates.service';
import { WHATSAPP_ACCOUNT_TEMPLATES_KEY } from './keys';

/**
 * Browses Meta's pre-approved template library, keyed by the active filters.
 *
 * Infinite rather than a single query because the library runs to thousands of entries across ~60
 * languages, and Meta does not honour `category` as a query parameter — the server narrows it while
 * walking cursor pages. A short page therefore does not mean the end of the results; only a null
 * cursor does, which is exactly what `getNextPageParam` keys on.
 */
export function useWhatsappTemplateLibrary(
  accountId: string,
  filters: TemplateLibraryFilters,
  options?: { enabled?: boolean },
) {
  // Library browsing is part of the add flow — the gateway gates it the same way
  const { available } = usePermission(ORG_WHATSAPP_ACCOUNTS.templates.add);

  const query = useInfiniteQuery<TemplateLibraryPageData, AxiosError>({
    queryKey: [
      ...WHATSAPP_ACCOUNT_TEMPLATES_KEY(accountId),
      'library',
      filters.category ?? '',
      filters.language ?? '',
      filters.search ?? '',
    ],
    queryFn: ({ pageParam }) => getWhatsappTemplateLibrary(accountId, filters, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: available && (options?.enabled ?? true),
  });

  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  return { ...query, items };
}
