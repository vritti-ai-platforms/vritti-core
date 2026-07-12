import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ModifierGroupData } from '@/schemas/offerings';
import { listModifierGroups } from '@/services/site/modifier-groups.service';
import { MODIFIER_GROUPS_BY_CATALOG_KEY } from './keys';

// Fetches modifier groups for a catalog
export function useModifierGroups(
  catalogId: string | null,
  options?: Omit<UseQueryOptions<ModifierGroupData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ModifierGroupData[], AxiosError>({
    queryKey: MODIFIER_GROUPS_BY_CATALOG_KEY(catalogId ?? ''),
    queryFn: () => listModifierGroups(catalogId as string),
    enabled: !!catalogId,
    ...options,
  });
}
