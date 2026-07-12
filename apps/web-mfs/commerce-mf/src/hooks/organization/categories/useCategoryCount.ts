import { useQuery } from '@tanstack/react-query';
import { ORG_CATEGORIES } from '@vritti/commerce-permissions/categories';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import { getCategoryCount } from '@/services/organization/categories.service';
import type { CategoryCountData } from '@/schemas/categories';
import { CATEGORY_COUNT_KEY } from './keys';

export function useCategoryCount() {
  const { available } = usePermission(ORG_CATEGORIES.view);
  return useQuery<CategoryCountData, AxiosError>({
    queryKey: CATEGORY_COUNT_KEY,
    queryFn: () => getCategoryCount(),
    enabled: available,
  });
}
