import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierContactData } from '@/schemas/suppliers';
import { type UpdateSupplierContactPayload, updateSupplierContact } from '@/services/suppliers.service';
import { SUPPLIER_CONTACTS_KEY, SUPPLIER_KEY } from './keys';

export function useUpdateSupplierContact(
  supplierId: string,
  contactId: string,
  options?: Omit<UseMutationOptions<SupplierContactData, AxiosError, UpdateSupplierContactPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SupplierContactData, AxiosError, UpdateSupplierContactPayload>({
    ...options,
    mutationFn: (data) => updateSupplierContact({ supplierId, contactId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_CONTACTS_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
