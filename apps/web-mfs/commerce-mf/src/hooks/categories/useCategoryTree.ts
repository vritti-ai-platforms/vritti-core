import { useQuery } from '@tanstack/react-query';
import { CATEGORIES } from '@vritti/commerce-permissions/categories';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { CategoryTreeNode } from '@/schemas/categories';
import { listCategoryTree } from '@/services/categories.service';
import { CATEGORY_TREE_KEY } from './keys';

export function useCategoryTree(search?: string) {
  // The tree endpoint is guarded by categories.view — self-gate so a locked/denied user never fires the request
  const { available } = usePermission(CATEGORIES.view);
  return useQuery<CategoryTreeNode[], AxiosError>({
    queryKey: [...CATEGORY_TREE_KEY, search ?? ''],
    queryFn: () => listCategoryTree(search),
    enabled: available,
  });
}
