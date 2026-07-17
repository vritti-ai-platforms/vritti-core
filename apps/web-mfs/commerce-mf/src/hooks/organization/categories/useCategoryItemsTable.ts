import { useQuery } from '@tanstack/react-query';
import { ORG_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import { getCategoryItemsTable } from '@/services/organization/categories.service';
import type { CategoryItemsTableResponse } from '@/schemas/categories';
import { CATEGORY_ITEMS_TABLE_KEY } from './keys';

export function useCategoryItemsTable(categoryId: string | null) {
  const { available } = usePermission(ORG_INVENTORY_ITEMS.view);
  return useQuery<CategoryItemsTableResponse, AxiosError>({
    queryKey: CATEGORY_ITEMS_TABLE_KEY(categoryId ?? ''),
    queryFn: () => getCategoryItemsTable(categoryId as string),
    enabled: available && !!categoryId,
  });
}
