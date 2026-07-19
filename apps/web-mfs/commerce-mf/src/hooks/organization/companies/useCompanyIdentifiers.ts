import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  AddIdentifierPayload,
  PartyIdentifierRow,
  PartyIdentifiersTableResponse,
} from '@/schemas/party-identifiers';
import {
  addCompanyIdentifier,
  getCompanyIdentifiers,
  removeCompanyIdentifier,
} from '@/services/organization/companies.service';
import { COMPANY_IDENTIFIERS_TABLE_KEY, COMPANY_KEY } from './keys';

// Fetches a company's identifiers; self-gates on the identifiers view permission
export function useCompanyIdentifiers(
  companyId: string,
  options?: Omit<UseQueryOptions<PartyIdentifiersTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_COMPANIES.identifiers.view);
  return useQuery<PartyIdentifiersTableResponse, AxiosError>({
    queryKey: COMPANY_IDENTIFIERS_TABLE_KEY(companyId),
    queryFn: () => getCompanyIdentifiers(companyId),
    ...options,
    enabled: !!companyId && available && (options?.enabled ?? true),
  });
}

export function useAddCompanyIdentifier(
  companyId: string,
  options?: Omit<UseMutationOptions<PartyIdentifierRow, AxiosError, AddIdentifierPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartyIdentifierRow, AxiosError, AddIdentifierPayload>({
    ...options,
    mutationFn: (data) => addCompanyIdentifier({ companyId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_IDENTIFIERS_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useRemoveCompanyIdentifier(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (identifierId) => removeCompanyIdentifier({ companyId, identifierId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_IDENTIFIERS_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}
