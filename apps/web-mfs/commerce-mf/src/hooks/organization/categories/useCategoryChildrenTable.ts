import { useQuery } from '@tanstack/react-query';
import { ORG_CATEGORIES } from '@vritti/commerce-permissions/categories';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import { getCategoryChildrenTable } from '@/services/organization/categories.service';
import type { CategoryChildrenTableResponse } from '@/schemas/categories';
import { CATEGORY_CHILDREN_TABLE_KEY } from './keys';

export function useCategoryChildrenTable(parentId: string | null) {
  const { available } = usePermission(ORG_CATEGORIES.view);
  return useQuery<CategoryChildrenTableResponse, AxiosError>({
    queryKey: CATEGORY_CHILDREN_TABLE_KEY(parentId ?? ''),
    queryFn: () => getCategoryChildrenTable(parentId as string),
    enabled: available && !!parentId,
  });
}
