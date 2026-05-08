import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierContactData } from '@/schemas/suppliers';
import { markPrimarySupplierContact } from '@/services/suppliers.service';
import { SUPPLIER_CONTACTS_KEY, SUPPLIER_KEY } from './keys';

export function useMarkPrimarySupplierContact(
  supplierId: string,
  options?: Omit<UseMutationOptions<SupplierContactData, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SupplierContactData, AxiosError, string>({
    ...options,
    mutationFn: (contactId) => markPrimarySupplierContact({ supplierId, contactId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_CONTACTS_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
