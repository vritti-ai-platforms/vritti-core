import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CategoryItemsTableResponse } from '@/schemas/categories';
import { getCategoryItemsTable } from '@/services/categories.service';
import { CATEGORY_ITEMS_TABLE_KEY } from './keys';

export function useCategoryItemsTable(categoryId: string | null) {
  return useQuery<CategoryItemsTableResponse, AxiosError>({
    queryKey: CATEGORY_ITEMS_TABLE_KEY(categoryId ?? ''),
    queryFn: () => getCategoryItemsTable(categoryId as string),
    enabled: !!categoryId,
  });
}
