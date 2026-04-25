import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CategoryCountData } from '@/schemas/categories';
import { getCategoryCount } from '@/services/categories.service';
import { CATEGORY_COUNT_KEY } from './keys';

export function useCategoryCount() {
  return useQuery<CategoryCountData, AxiosError>({
    queryKey: CATEGORY_COUNT_KEY,
    queryFn: () => getCategoryCount(),
  });
}
