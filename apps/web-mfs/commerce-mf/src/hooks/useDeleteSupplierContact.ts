import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { deleteSupplierContact } from '@/services/suppliers.service';
import { SUPPLIER_CONTACTS_KEY } from './useSupplierContacts';

export function useDeleteSupplierContact(
  supplierId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (contactId) => deleteSupplierContact({ supplierId, contactId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_CONTACTS_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: ['commerce', 'suppliers', supplierId] });
      options?.onSuccess?.(...args);
    },
  });
}
