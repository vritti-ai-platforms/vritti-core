import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  PartyBankAccountPayload,
  PartyBankAccountRow,
  PartyBankAccountsTableResponse,
} from '@/schemas/party-bank-accounts';
import {
  createCompanyBankAccount,
  deleteCompanyBankAccount,
  getCompanyBankAccounts,
  updateCompanyBankAccount,
} from '@/services/organization/companies.service';
import { COMPANY_BANK_ACCOUNTS_TABLE_KEY, COMPANY_KEY } from './keys';

// Fetches a company's bank accounts; self-gates on the bank accounts view permission
export function useCompanyBankAccountsTable(
  companyId: string,
  options?: Omit<UseQueryOptions<PartyBankAccountsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_COMPANIES.bankAccounts.view);
  return useQuery<PartyBankAccountsTableResponse, AxiosError>({
    queryKey: COMPANY_BANK_ACCOUNTS_TABLE_KEY(companyId),
    queryFn: () => getCompanyBankAccounts(companyId),
    ...options,
    enabled: !!companyId && available && (options?.enabled ?? true),
  });
}

export function useCreateCompanyBankAccount(
  companyId: string,
  options?: Omit<UseMutationOptions<PartyBankAccountRow, AxiosError, PartyBankAccountPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartyBankAccountRow, AxiosError, PartyBankAccountPayload>({
    ...options,
    mutationFn: (data) => createCompanyBankAccount({ companyId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_BANK_ACCOUNTS_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateBankAccountVars {
  bankAccountId: string;
  data: PartyBankAccountPayload;
}

export function useUpdateCompanyBankAccount(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateBankAccountVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateBankAccountVars>({
    ...options,
    mutationFn: ({ bankAccountId, data }) => updateCompanyBankAccount({ companyId, bankAccountId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_BANK_ACCOUNTS_TABLE_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteCompanyBankAccount(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (bankAccountId) => deleteCompanyBankAccount({ companyId, bankAccountId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_BANK_ACCOUNTS_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}
