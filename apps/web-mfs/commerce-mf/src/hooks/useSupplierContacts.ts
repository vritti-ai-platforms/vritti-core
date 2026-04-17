import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierContactData } from '@/schemas/suppliers';
import { getSupplierContacts } from '@/services/suppliers.service';

export const SUPPLIER_CONTACTS_KEY = (supplierId: string) =>
  ['commerce', 'suppliers', supplierId, 'contacts'] as const;

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
