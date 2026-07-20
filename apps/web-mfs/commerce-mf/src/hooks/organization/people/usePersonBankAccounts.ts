import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  PartyBankAccountPayload,
  PartyBankAccountRow,
  PartyBankAccountsTableResponse,
} from '@/schemas/party-bank-accounts';
import {
  createPersonBankAccount,
  deletePersonBankAccount,
  getPersonBankAccounts,
  updatePersonBankAccount,
} from '@/services/organization/people.service';
import { PERSON_BANK_ACCOUNTS_TABLE_KEY, PERSON_KEY } from './keys';

// Fetches a person's bank accounts; self-gates on the bank accounts view permission
export function usePersonBankAccountsTable(
  personId: string,
  options?: Omit<UseQueryOptions<PartyBankAccountsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_PEOPLE.bankAccounts.view);
  return useQuery<PartyBankAccountsTableResponse, AxiosError>({
    queryKey: PERSON_BANK_ACCOUNTS_TABLE_KEY(personId),
    queryFn: () => getPersonBankAccounts(personId),
    ...options,
    enabled: !!personId && available && (options?.enabled ?? true),
  });
}

export function useCreatePersonBankAccount(
  personId: string,
  options?: Omit<UseMutationOptions<PartyBankAccountRow, AxiosError, PartyBankAccountPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartyBankAccountRow, AxiosError, PartyBankAccountPayload>({
    ...options,
    mutationFn: (data) => createPersonBankAccount({ personId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_BANK_ACCOUNTS_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateBankAccountVars {
  bankAccountId: string;
  data: PartyBankAccountPayload;
}

export function useUpdatePersonBankAccount(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateBankAccountVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateBankAccountVars>({
    ...options,
    mutationFn: ({ bankAccountId, data }) => updatePersonBankAccount({ personId, bankAccountId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_BANK_ACCOUNTS_TABLE_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeletePersonBankAccount(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (bankAccountId) => deletePersonBankAccount({ personId, bankAccountId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_BANK_ACCOUNTS_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}
