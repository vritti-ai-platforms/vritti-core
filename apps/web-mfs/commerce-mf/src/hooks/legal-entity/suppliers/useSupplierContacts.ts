import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierContactData } from '@/schemas/suppliers';
import { getSupplierContacts } from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_CONTACTS_KEY } from './keys';

export function useSupplierContacts(
  supplierId: string | null,
  options?: Omit<UseQueryOptions<SupplierContactData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<SupplierContactData[], AxiosError>({
    queryKey: SUPPLIER_CONTACTS_KEY(supplierId ?? ''),
    queryFn: () => getSupplierContacts(supplierId as string),
    enabled: !!supplierId,
    ...options,
  });
}
