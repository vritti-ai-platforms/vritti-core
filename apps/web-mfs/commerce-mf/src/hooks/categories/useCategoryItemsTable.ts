import { useQuery } from '@tanstack/react-query';
import { CATEGORIES } from '@vritti/commerce-permissions/categories';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { CategoryItemsTableResponse } from '@/schemas/categories';
import { getCategoryItemsTable } from '@/services/categories.service';
import { CATEGORY_ITEMS_TABLE_KEY } from './keys';

export function useCategoryItemsTable(categoryId: string | null) {
  // The items table is guarded by categories.inventory-items.view — self-gate so a locked user never fires it
  const { available } = usePermission(CATEGORIES.inventoryItems.view);
  return useQuery<CategoryItemsTableResponse, AxiosError>({
    queryKey: CATEGORY_ITEMS_TABLE_KEY(categoryId ?? ''),
    queryFn: () => getCategoryItemsTable(categoryId as string),
    enabled: available && !!categoryId,
  });
}
