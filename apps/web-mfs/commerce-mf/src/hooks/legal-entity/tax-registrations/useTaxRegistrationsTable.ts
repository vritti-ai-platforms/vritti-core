import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { LE_TAX_REGISTRATIONS } from '@vritti/commerce-permissions/tax-registrations';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { TaxRegistrationsTableResponse } from '@/schemas/tax-registrations';
import { getTaxRegistrationsTable } from '@/services/legal-entity/tax-registrations.service';
import { TAX_REGISTRATIONS_TABLE_KEY } from './keys';

type Options = Omit<UseQueryOptions<TaxRegistrationsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>;

// Self-gated: a denied or locked user never fires the request the endpoint would reject anyway
export function useTaxRegistrationsTable(options?: Options) {
  const { available } = usePermission(LE_TAX_REGISTRATIONS.view);
  return useQuery<TaxRegistrationsTableResponse, AxiosError>({
    queryKey: TAX_REGISTRATIONS_TABLE_KEY,
    queryFn: getTaxRegistrationsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
