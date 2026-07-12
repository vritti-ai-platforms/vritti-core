import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ModifierGroupDetail } from '@/schemas/modifiers';
import { getModifierGroup } from '@/site/services/modifier-groups.service';
import { MODIFIER_GROUP_KEY } from './keys';

// Fetches a single modifier group with its options
export function useModifierGroup(
  catalogId: string,
  groupId: string | null,
  options?: Omit<UseQueryOptions<ModifierGroupDetail, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ModifierGroupDetail, AxiosError>({
    queryKey: MODIFIER_GROUP_KEY(catalogId, groupId ?? ''),
    queryFn: () => getModifierGroup({ catalogId, groupId: groupId as string }),
    enabled: !!groupId,
    ...options,
  });
}
