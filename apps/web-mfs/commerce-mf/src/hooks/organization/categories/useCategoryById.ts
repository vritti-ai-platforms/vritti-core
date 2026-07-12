import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { getCategoryById } from '@/services/organization/categories.service';
import type { CategoryData } from '@/schemas/categories';
import { CATEGORIES_KEY } from './keys';

export function useCategoryById(id: string | null) {
  return useQuery<CategoryData, AxiosError>({
    queryKey: [...CATEGORIES_KEY, 'detail', id],
    queryFn: () => getCategoryById(id as string),
    enabled: !!id,
  });
}
