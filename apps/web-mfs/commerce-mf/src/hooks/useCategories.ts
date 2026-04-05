import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CategoryData } from '@/schemas/categories';
import { listCategories } from '@/services/categories.service';

export function useCategories(
  buId: string | null,
  options?: Omit<UseQueryOptions<CategoryData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<CategoryData[], AxiosError>({
    queryKey: ['categories', buId],
    queryFn: () => listCategories(buId as string),
    enabled: !!buId,
    ...options,
  });
}
