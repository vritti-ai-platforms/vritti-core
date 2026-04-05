import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ModifierGroupDetail } from '@/schemas/modifiers';
import { getModifierGroup } from '@/services/modifier-groups.service';

// Fetches a single modifier group with its options
export function useModifierGroup(
  id: string | null,
  options?: Omit<UseQueryOptions<ModifierGroupDetail, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ModifierGroupDetail, AxiosError>({
    queryKey: ['modifier-groups', id],
    queryFn: () => getModifierGroup(id as string),
    enabled: !!id,
    ...options,
  });
}
