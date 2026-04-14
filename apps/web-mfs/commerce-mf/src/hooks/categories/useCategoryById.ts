import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CategoryData } from '@/schemas/categories';
import { getCategoryById } from '@/services/categories.service';
import { CATEGORIES_KEY } from './keys';

export function useCategoryById(id: string | null) {
  return useQuery<CategoryData, AxiosError>({
    queryKey: [...CATEGORIES_KEY, 'detail', id],
    queryFn: () => getCategoryById(id as string),
    enabled: !!id,
  });
}
