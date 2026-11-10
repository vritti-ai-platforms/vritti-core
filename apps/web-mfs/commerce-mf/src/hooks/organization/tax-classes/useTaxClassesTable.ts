import { useQuery } from '@tanstack/react-query';
import { ORG_TAX_CLASSES } from '@vritti/commerce-permissions/tax-classes';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { TaxClassesTableResponse } from '@/schemas/tax-classes';
import { getTaxClassesTable } from '@/services/organization/tax-classes.service';
import { TAX_CLASSES_TABLE_KEY } from './keys';

// Fetches the tax classes with the tax groups each is taxed by in the table's country and day; self-gates on the view
// permission
export function useTaxClassesTable() {
  const { available } = usePermission(ORG_TAX_CLASSES.view);
  return useQuery<TaxClassesTableResponse, AxiosError>({
    queryKey: TAX_CLASSES_TABLE_KEY,
    queryFn: getTaxClassesTable,
    enabled: available,
  });
}
