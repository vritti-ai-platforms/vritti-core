import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  PartyContactPayload,
  PartyContactRow,
  PartyContactsTableResponse,
  PartyContactUpdatePayload,
} from '@/schemas/party-contacts';
import {
  createCompanyContact,
  deleteCompanyContact,
  getCompanyContacts,
  updateCompanyContact,
} from '@/services/organization/companies.service';
import { COMPANY_CONTACTS_TABLE_KEY, COMPANY_KEY } from './keys';

// Fetches a company's contacts; self-gates on the contacts view permission
export function useCompanyContactsTable(
  companyId: string,
  options?: Omit<UseQueryOptions<PartyContactsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_COMPANIES.contacts.view);
  return useQuery<PartyContactsTableResponse, AxiosError>({
    queryKey: COMPANY_CONTACTS_TABLE_KEY(companyId),
    queryFn: () => getCompanyContacts(companyId),
    ...options,
    enabled: !!companyId && available && (options?.enabled ?? true),
  });
}

export function useCreateCompanyContact(
  companyId: string,
  options?: Omit<UseMutationOptions<PartyContactRow, AxiosError, PartyContactPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartyContactRow, AxiosError, PartyContactPayload>({
    ...options,
    mutationFn: (data) => createCompanyContact({ companyId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_CONTACTS_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateContactVars {
  contactId: string;
  data: PartyContactUpdatePayload;
}

export function useUpdateCompanyContact(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateContactVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateContactVars>({
    ...options,
    mutationFn: ({ contactId, data }) => updateCompanyContact({ companyId, contactId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_CONTACTS_TABLE_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteCompanyContact(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (contactId) => deleteCompanyContact({ companyId, contactId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_CONTACTS_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}
