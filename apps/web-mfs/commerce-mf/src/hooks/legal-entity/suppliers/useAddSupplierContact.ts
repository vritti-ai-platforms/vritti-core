import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierContactData } from '@/schemas/suppliers';
import { addSupplierContact, type CreateSupplierContactPayload } from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_CONTACTS_KEY, SUPPLIER_KEY } from './keys';

export function useAddSupplierContact(
  supplierId: string,
  options?: Omit<UseMutationOptions<SupplierContactData, AxiosError, CreateSupplierContactPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SupplierContactData, AxiosError, CreateSupplierContactPayload>({
    ...options,
    mutationFn: (data) => addSupplierContact({ supplierId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_CONTACTS_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
