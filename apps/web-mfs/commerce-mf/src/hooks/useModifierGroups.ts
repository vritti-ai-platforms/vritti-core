import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ModifierGroupData } from '@/schemas/items';
import { listModifierGroups } from '@/services/modifier-groups.service';

// Fetches modifier groups for a business unit
export function useModifierGroups(
  buId: string | null,
  options?: Omit<UseQueryOptions<ModifierGroupData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ModifierGroupData[], AxiosError>({
    queryKey: ['modifier-groups', buId],
    queryFn: () => listModifierGroups(buId as string),
    enabled: !!buId,
    ...options,
  });
}
