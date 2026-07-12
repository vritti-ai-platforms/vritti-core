import { useQuery } from '@tanstack/react-query';
import { CATEGORIES } from '@vritti/commerce-permissions/categories';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { CategoryCountData } from '@/schemas/categories';
import { getCategoryCount } from '@/services/categories.service';
import { CATEGORY_COUNT_KEY } from './keys';

export function useCategoryCount() {
  const { available } = usePermission(CATEGORIES.view);
  return useQuery<CategoryCountData, AxiosError>({
    queryKey: CATEGORY_COUNT_KEY,
    queryFn: () => getCategoryCount(),
    enabled: available,
  });
}
