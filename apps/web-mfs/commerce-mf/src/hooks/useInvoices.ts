import { type UseMutationOptions, type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Invoice } from '../schemas';
import { generateInvoice, getInvoiceById, getInvoices, updateInvoiceStatus } from '../services';

type UseInvoicesOptions = Omit<UseQueryOptions<Invoice[], Error>, 'queryKey' | 'queryFn'>;

// Fetches all invoices for an org+bu
export function useInvoices(businessUnitId: string, options?: UseInvoicesOptions) {
  return useQuery<Invoice[], Error>({
    queryKey: ['commerce', 'invoices', businessUnitId],
    queryFn: () => getInvoices(businessUnitId),
    enabled: !!businessUnitId,
    ...options,
  });
}

type UseInvoiceOptions = Omit<UseQueryOptions<Invoice, Error>, 'queryKey' | 'queryFn'>;

// Fetches a single invoice by ID
export function useInvoice(id: string, options?: UseInvoiceOptions) {
  return useQuery<Invoice, Error>({
    queryKey: ['commerce', 'invoices', id],
    queryFn: () => getInvoiceById(id),
    enabled: !!id,
    ...options,
  });
}

type UseGenerateInvoiceOptions = Omit<UseMutationOptions<Invoice, Error, string>, 'mutationFn'>;

// Generates an invoice from an order
export function useGenerateInvoice(options?: UseGenerateInvoiceOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateInvoice,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'invoices'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

interface UpdateInvoiceStatusParams {
  id: string;
  status: string;
}

type UseUpdateInvoiceStatusOptions = Omit<
  UseMutationOptions<unknown, Error, UpdateInvoiceStatusParams>,
  'mutationFn'
>;

// Updates an invoice status and invalidates the list
export function useUpdateInvoiceStatus(options?: UseUpdateInvoiceStatusOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: UpdateInvoiceStatusParams) => updateInvoiceStatus(id, status),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'invoices'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
