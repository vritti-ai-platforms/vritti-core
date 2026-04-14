import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CategoryChildrenTableResponse } from '@/schemas/categories';
import { getCategoryChildrenTable } from '@/services/categories.service';
import { CATEGORIES_KEY } from './keys';

export const CATEGORY_CHILDREN_TABLE_KEY = (parentId: string) => [...CATEGORIES_KEY, parentId, 'children-table'] as const;

export function useCategoryChildrenTable(parentId: string | null) {
  return useQuery<CategoryChildrenTableResponse, AxiosError>({
    queryKey: CATEGORY_CHILDREN_TABLE_KEY(parentId ?? ''),
    queryFn: () => getCategoryChildrenTable(parentId as string),
    enabled: !!parentId,
  });
}
