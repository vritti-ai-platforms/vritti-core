import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CategoryTreeNode } from '@/schemas/categories';
import { listCategoryTree } from '@/services/categories.service';
import { CATEGORIES_KEY } from './keys';

export const CATEGORY_TREE_KEY = [...CATEGORIES_KEY, 'tree'] as const;

export function useCategoryTree(search?: string) {
  return useQuery<CategoryTreeNode[], AxiosError>({
    queryKey: [...CATEGORY_TREE_KEY, search ?? ''],
    queryFn: () => listCategoryTree(search),
  });
}
